using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SmsRateLimiter.Exceptions;
using SmsRateLimiter.Models;
using SmsRateLimiter.Services;

namespace SmsRateLimiter.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmsController: ControllerBase
    {
        private readonly IRateLimiter _rateLimiter;

        public SmsController(IRateLimiter rateLimiter)
        {
            _rateLimiter = rateLimiter;
        }

        [HttpGet]
        [Route("hello")]
        public IActionResult Get()
        {
            return Ok("Hello World");
        }

        [HttpGet("can-send-sms")]
        public async Task<IActionResult> CanSendSms([FromQuery] string accountNumber, [FromQuery] string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber))
            {
                return BadRequest("Phone number is required");
            }
            if (string.IsNullOrEmpty(accountNumber))
            {
                return BadRequest("Account number is required");
            }

            try
            {
                await _rateLimiter.CheckLimits(accountNumber, phoneNumber);
            }
            catch (RateLimitExceededException ex)
            {
                return StatusCode(429, ex.Message);
            }
            catch (GlobalRateLimitExceededException ex)
            {
                return StatusCode(429, ex.Message);
            }
            catch (Exception)
            {
                return StatusCode(500, "An error occurred while processing your request");
            }

            var response = new CanSendSmsResponse
            {
                AccountNumber = accountNumber,
                PhoneNumber = phoneNumber,
                Message = $"[{accountNumber}] {phoneNumber} can send sms"
            };

            return Ok(response);
        }
    }
}