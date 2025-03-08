
using SmsRateLimiter.Exceptions;
using StackExchange.Redis;
using System;
using System.Threading.Tasks;

namespace SmsRateLimiter.Services
{
    public class RateLimiter
    {         
        private readonly IDatabase _db;
        private readonly int MAX_PER_NUMBER_PER_SEC;
        private readonly int MAX_GLOBAL_PER_SEC;

        public RateLimiter(IConfiguration configuration, IConnectionMultiplexer redis)
        {
            _db = redis.GetDatabase();
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
        public async void CheckLimits(string phoneNumber)
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var keyNumber = $"rate_limit:{phoneNumber}";
            var keyGlobal = "rate_limit:global";

            // Check and enforce Per Number Limit
            var numberCount = (int)(await _db.StringGetAsync(keyNumber));
            if (numberCount >= MAX_PER_NUMBER_PER_SEC)
            {
                throw new RateLimitExceededException();
            }

            // Check and enforce Global Limit
            var globalCount = (int)(await _db.StringGetAsync(keyGlobal));
            if (globalCount >= MAX_GLOBAL_PER_SEC)
            {
                throw new GlobalRateLimitExceededException();
            }

            // Update Counts in Redis Db
            var milliseconds = 1000 - (now % 1000); // time until the next second, ensures that the count is reset every second
                                                    // multiple messages sent in the same second, will expire at the same time
            var transaction = _db.CreateTransaction();
            _ = transaction.StringIncrementAsync(keyNumber);
            _ = transaction.StringIncrementAsync(keyGlobal);
            _ = transaction.KeyExpireAsync(keyNumber, TimeSpan.FromMilliseconds(milliseconds));
            _ = transaction.KeyExpireAsync(keyGlobal, TimeSpan.FromMilliseconds(milliseconds));
            await transaction.ExecuteAsync();
        }
    }
}