# breezets-cli

## Installation
To install, run

    npm install breezets
    npm install -g breezets-cli

## Usage
To run breezets in its most basic version, type the following in a command prompt

	    breezets http://72.10.1.2/Metadata

replacing the URL with the metadata URL of your running Breeze data service. 
This will generate the following file (see the "Generated code" section for details):

	    myservice.d.ts

To generate code for full, strongly typed LINQ-style access to you Breeze service, type

	    breezets http://72.10.1.2/Metadata --proxyname OrdersServer

This will generate some more files (again, see the "Generated code" section for details):

		myservice.d.ts
		myservice.ts
		breezeextensions.ts

### Parameters
The command accepts the following parameters:

		Usage: breezets metadataurl [options]
		Arguments:
		  metadataurl                      The URL supplying the Breeze data service metadata
		Options:
		  -h, --help                       output usage information
		  -s, --servicename <servicename>  The name of the Breeze data service (used when naming files during code generation)
		  -n, --namespace <namespace>      The namespace that all generated code wwill be placed in.
		  -p, --proxyname <proxyname>      Generate a strongly typed client-side proxy with the specified named
		  -u, --url <url>                  The default service URL used by the client-side proxy (only used with --proxyname)
		  -t, --no-typedqueries            Do not generate strongly typed queries on the client-side proxy (only used with --proxyname)

## Generated code
Breezets code generation can run in two modes: basic typedef (without the --proxyname parameter) and full strongly typed query mode (with the --proxyname parameter).

###Basic type definitions
Without the --proxyname option, breezets will only generate a Typescript type definition file (myservice.d.ts)
specifying the Javascript entities that the Breeze data service is returning.

For instance, if you run

	    breezets -s sales -n acme.sales http://1.2.3.4/breeze/sales/Metadata

you get

		sales.d.ts (generated code):
			declare module acme.sales.typedefs
			{
			   export interface Customer extends breeze.Entity {
				  Id: number;
				  Name: string;
				  Orders: Order[];
			   }

			   export interface Order extends breeze.Entity {
				  Id: number;
				  CustomerId: number;
				  Customer: Customer;
				  OrderDate: Date;
				  Amount: number;
				  Description: string;
			   }
			}

This means that instead of writing your Typescript client-side code as

		yourcode.ts (before breezets):
			class OverdueOrdersViewModel {
			   public orders: any[] = null;
			   constructor (private manager: breeze.EntityManager, private custId: number, private before: Date) {};
			   public update () {
				  var query = 
		             EntityQuery
		             .from('Orders')
		             .where('CustomerID', 'eq', this.custId)
		             .where('OrderDate', '<', this.before)
		             .where('Deliveries', 'any', new Predicate('DeliveredDate', 'eq', null));
				  this.manager.executeQuery().then(res => this.orders = resp.results);
			   }
			}

you can now write

		yourcode.ts (after breezets):
			class OverdueOrdersViewModel {
			   public orders: Order[] = null;
			   constructor (private manager: breeze.EntityManager, private custId: number, private before: Date) {};
			   public update () {
				  var query = 
		             EntityQuery
		             .from('Orders')
		             .where('CustomerID', 'eq', this.custId)
		             .where('OrderDate', '<', this.before)
		             .where('Deliveries', 'any', new Predicate('DeliveredDate', 'eq', null));
				  this.manager.executeQuery().then(res => this.orders = <Order[]><any>resp.results);
			   }
			}

This probably doesn't look like much - but having a strongly type 'orders' property will make a great difference to those using the CustomerViewModel.

But you'll notice that there are still an awful lot of strings in the queries (all the entities, fields, comparison operators) - and if you misspell any of them, you won't know until you try to execute that code. Read below for a cure.

###LINQ-style query support

If you instead run the breezets command with the --proxyname option, you will also get a strongly typed client side proxy, with Linq-like queries.

for instance, if you run

	    breezets -s sales -n acme.sales -p SalesServer http://localhost:64419/breeze/sales/Metadata

you will also get the typescript files sales.ts, containing the class acme.sales.SalesServer.

You can now re-write the query code:

		yourcode.ts (with full breezets codegen):
			class OverdueOrdersViewModel {
			   public orders: Order[] = null;
			   constructor (private manager: SalesServer, private custId: number, private before: Date) {};
			   public update () {
				  this.manager
					  .Orders
					  .where(o => o.CustomerId.equals(this.custId))
					  .where(o => o.OrderDate.before(this.before))
					  .where(o => o.Deliveries.any(d => d.DeliveredDate.isNull()))
					  .execute()
					  .then(res => this.orders = res);
			   }
			}

All the verbatim strings are gone! 

And if you misspell

	    .where(o => o.OderDate.before(this.before))

the Typescript compiler will catch it (and you IDE will probably indicate it to you before that).

img

And your IDE can give you intellisense support:

img