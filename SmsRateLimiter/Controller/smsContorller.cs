using Microsoft.AspNetCore.Mvc;

namespace SmsRateLimiter.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class SmsController: ControllerBase
    {
        [HttpGet]
        [Route("hello")]
        public IActionResult Get()
        {
            return Ok("Hello World");
        }
    }
}