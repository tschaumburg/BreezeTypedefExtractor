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
specifying the Javascript entities that the Breeze data service is returning:

    declare module mynamespace.typedef
    {
       public interface Order
       {
           public customer: Customer;

###Strongly-typed query support

