
using Microsoft.AspNetCore.SignalR;
using SmsRateLimiter.Exceptions;
using StackExchange.Redis;

namespace SmsRateLimiter.Services
{
    public class RateLimiter : IRateLimiter
    {
        private readonly IDatabase _db;
        private readonly IHubContext<SmsHub> _hubContext;
        private readonly int MAX_PER_NUMBER_PER_SEC;
        private readonly int MAX_GLOBAL_PER_SEC;

        public RateLimiter(
            IConfiguration configuration,
            IConnectionMultiplexer redis,
            IHubContext<SmsHub> hubContext
        ) {
            _db = redis.GetDatabase();
            _hubContext = hubContext;
            MAX_PER_NUMBER_PER_SEC = configuration.GetValue<int>("RateLimiter:PerNumber");
            MAX_GLOBAL_PER_SEC = configuration.GetValue<int>("RateLimiter:Global");
        }

        /// <summary>
        /// For the given phone number, check if the sms rate limite and global rate limit is exceeded.
        /// If they are exceeded, an exception is thrown.
        /// Otherwise, the counts are updated in the Redis Db.
        /// </summary>
        /// <param name="phoneNumber"></param>
        /// <throws>RateLimitExceededException</throws>
        /// <throws>GlobalRateLimitExceededException</throws>
        public async Task CheckLimits(string accountNumber, string phoneNumber)
        {
            var now = DateTimeOffset.UtcNow;
            var keyNumber = $"rate_limit:{accountNumber}{phoneNumber}";
            var keyGlobal = $"rate_limit:{accountNumber}global";
            var numberCount = (int)(await _db.StringGetAsync(keyNumber));
            var globalCount = (int)(await _db.StringGetAsync(keyGlobal));

            // Check and enforce Per Number Limit
            if (numberCount >= MAX_PER_NUMBER_PER_SEC)
            {
                BroadcastRateUpdate(accountNumber, phoneNumber, numberCount++, globalCount, now);
                throw new RateLimitExceededException(phoneNumber);
            }

            // Check and enforce Global Limit
            if (globalCount >= MAX_GLOBAL_PER_SEC)
            {
                BroadcastRateUpdate(accountNumber, phoneNumber, numberCount, globalCount++, now);
                throw new GlobalRateLimitExceededException(phoneNumber);
            }

            // time until the next message window, ensures that the count is reset every message window
            // multiple messages sent in the same window, will expire at the same time
            var milliseconds = 1000 - (now.ToUnixTimeMilliseconds() % 1000);         
            // Update Counts in Redis Db
            var transaction = _db.CreateTransaction();
            _ = transaction.StringIncrementAsync(keyNumber);
            _ = transaction.StringIncrementAsync(keyGlobal);
            _ = transaction.KeyExpireAsync(keyNumber, TimeSpan.FromMilliseconds(milliseconds));
            _ = transaction.KeyExpireAsync(keyGlobal, TimeSpan.FromMilliseconds(milliseconds));
            await transaction.ExecuteAsync();

            BroadcastRateUpdate(accountNumber, phoneNumber, numberCount++, globalCount++, now);
        }

        private async void BroadcastRateUpdate(string accountNumber, string phoneNumber, int numberCount, int globalCount, DateTimeOffset now)
        {            
            var rateLimits = new[]
            {
                new { accountNumber, phoneNumber, count = numberCount, limit = MAX_PER_NUMBER_PER_SEC, dateTime = now },
                new { accountNumber, phoneNumber = "global", count = globalCount, limit = MAX_GLOBAL_PER_SEC, dateTime = now }
            };

            await _hubContext.Clients.All.SendAsync("UpdateRateLimits", rateLimits);
        }
    }
}