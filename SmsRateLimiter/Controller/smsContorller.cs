using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SmsRateLimiter.Exceptions;
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
        public async Task<IActionResult> CanSendSms([FromQuery] string phoneNumber)
        {
            if (string.IsNullOrEmpty(phoneNumber))
            {
                return BadRequest("Phone number is required");
            }

            try
            {
                await _rateLimiter.CheckLimits(phoneNumber);
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

            return Ok($"{phoneNumber} can send sms");
        }
    }
}