using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

public class SmsHub : Hub
{
    public async Task SendRateLimitUpdate(object rateLimit)
    {
        await Clients.All.SendAsync("UpdateRateLimits", rateLimit);
    }
}