using Microsoft.AspNetCore.Mvc;
using StoreOrders.Core.Constants;

namespace StoreOrders.Web.Controllers;

[ApiController]
[Route("/api")]
public class ServerController : ControllerBase
{
    public IActionResult Index()
    {
        return Ok(ApplicationData.GenerateApplicationData());
    }
}