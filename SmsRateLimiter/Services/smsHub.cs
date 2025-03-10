using Microsoft.AspNetCore.SignalR;

public class SmsHub : Hub
{
    public async Task SendRateLimitUpdate(object rateLimit)
    {
        await Clients.All.SendAsync("UpdateRateLimits", rateLimit);
    }
}