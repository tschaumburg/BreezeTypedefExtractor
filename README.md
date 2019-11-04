# BreezeTypedefExtractor
Visual Studio extension generating and managing typed references to Breeze data service.

A typed Breeze reference can be used as follows from Typescript:

    var t = 
      new OrdersServer("https://...")
      .Customers
      .where(cust => cust.Orders.any(order => order.delDate.after(Date.now)))
      .execute();

And the above is fully typed - giving you Intellisense, and compile-time checking of field names, types, comparison operators, etc. 

See the Features section below.

## Installing
The easiest way to install is to install the Visual Studio extension (see below).

If you're not using Visual Studio (or Windows, for that matter), you can still install a command-line tool using NPM

###Installing the Visual Studio Extension (VSIX)

###Installing using NPM

##Using


###Using from Visual Studio

- Determine the *metadata URL* of the Breeze data service you want to reference (test it by typing it into a browser - it should return a JSON string starting with '{"schema":{"namespace":...')
- Start Visual Studio
- Create a project supporting Typescript, or open an existing one
- Right-click the project node in the Solution Explorer, and choose "Add a Breeze reference...":
  img
- In the dialog box that opens, type in the Metadata URL you determined earlier, and click OK
  ing
- After downloading metadata from the URL you supplied, a reference will be added under "Breeze references":
  img
- You are now ready to start using the reference:
  img

## Features
Now you can write strongly typed queries against a Breeze data service:

    var salesServer = new OrdersServer("https://sales.internal.acme.com:10265/orders");
    salesServer
      .Orders
      .where(order => order.shipped == false)
      .and(order => order.estimatedDelivery.before(new Date(2016, 12, 31)))
      .execute()
      .then(
          pendingOrders => 
          {
            var pendingRevenue = pendingOrders.sum(order => order.total);
            if (pendingRevenue > 1000000)
              // alert delivery dept.
          }
        );
  
  This doesn't look too different from the out-of-the-box Breeze queries - until you make an error (type 'Oders' instead of 'Orders') or forget what that field was called ('estimatedDelivery' or 'plannedShipping'?).
  
### Strongly typed

If you mistype 'Orders', you'll get a Visual Studio error-indication:
  
img
  
and of course an error message:
  
img
  
This also extends intothe queries themselves:
  
img (for .and(order => order.estimatedDeliveryCost.before(new Date(2016, 12, 31)))

###Intellisense

The strongly typed query interface will also enable Visual Studio Intellisense.

For instance, if you're in doubt about the name of that shipping date field:

img
