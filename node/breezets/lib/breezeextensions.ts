///<reference path='../typings/index.d.ts' />
module dk.schaumburgit.breezeextensions
{
    export class TEntityQuery<TEntityQueryBuilder, TEntity>
    {
        private _entitymanager: breeze.EntityManager = null;
        private rootname: string = null;
        private rootinfo: TEntityQueryBuilder = null;
        private predicate: TPredicate<TEntityQueryBuilder, TEntity> = null;
        private _orderBy: PrimitiveFieldInfo = null;
        constructor(_entityManager: breeze.EntityManager, rootname: string, rootinfo: TEntityQueryBuilder, predicate: TPredicate<TEntityQueryBuilder, TEntity>, orderBy: PrimitiveFieldInfo)
        {
            //super();
            this.rootname = rootname;
            this.rootinfo = rootinfo;
            this.predicate = predicate;
            this._orderBy = orderBy;
            this._entitymanager = _entityManager;
        }

        public execute(): breeze.promises.IPromise<TEntity[]>
        {
            var breezeQuery = breeze.EntityQuery.from(this.rootname);
            if (this.predicate != null)
                breezeQuery = breezeQuery.where(this.predicate.getBreezePredicate());
            if (this._orderBy != null)
                breezeQuery = breezeQuery.orderBy(this._orderBy.getFieldName());

            return this._entitymanager.executeQuery(breezeQuery).then(dt => <TEntity[]><any>dt.results);
        }

        public orderBy(fieldSelector: (query: TEntityQueryBuilder) => PrimitiveFieldInfo): TEntityQuery<TEntityQueryBuilder, TEntity>
        {
            var field = fieldSelector(this.rootinfo);

            return new TEntityQuery<TEntityQueryBuilder, TEntity>(this._entitymanager, this.rootname, this.rootinfo, this.predicate, field);
        }

        /**
         * Creates a new query, filtered according to the specified condition (note: the filtered query is the
         * returned value - the source query is unchanged).
         * 
         * Example:
         *    var ordersdb = new MyOrdersProxy("https://orders.internal.acme.com");
         *    var allOrders = ordersdb.Orders;
         *    var largeOrders = allOrders.where(notTooSmall);
         *    var smallOrders = allOrders.where(notTooBig);
         *    var justSoOrders = largeOrders.where(notTooSmall);
         * 
         * @param condition
         */
        public where(condition: TPredicate<TEntityQueryBuilder, TEntity>): TEntityQuery<TEntityQueryBuilder, TEntity>;

        /**
         * Filters
         * @param queryExpression
         */
        public where(queryExpression: (query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>): TEntityQuery<TEntityQueryBuilder, TEntity>;
        public where(arg: ((query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>) | TPredicate<TEntityQueryBuilder, TEntity>): TEntityQuery<TEntityQueryBuilder, TEntity>
        {
            if (typeof arg === 'function')
                return this.where_function(<(query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>>arg);
            else
                return this.where_predicate(<TPredicate<TEntityQueryBuilder, TEntity>>arg);
        }

        private where_predicate(predicate: TPredicate<TEntityQueryBuilder, TEntity>): TEntityQuery<TEntityQueryBuilder, TEntity>
        {
            var newPredicate: TPredicate<TEntityQueryBuilder, TEntity> = predicate;
            if (this.predicate != null)
                newPredicate = this.predicate.and(predicate);

            return new TEntityQuery<TEntityQueryBuilder, TEntity>(this._entitymanager, this.rootname, this.rootinfo, predicate, this._orderBy);
        }

        private where_function(queryExpression: (query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>): TEntityQuery<TEntityQueryBuilder, TEntity>
        {
            var predicate = queryExpression(this.rootinfo);
            return this.where_predicate(predicate);
        }
    }

    export abstract class TPredicate<TEntityQueryBuilder, TEntity>
    {
        private builder: TEntityQueryBuilder;
        constructor(builder: TEntityQueryBuilder)
        {
            this.builder = builder;
        }

        public abstract getBreezePredicate(): breeze.Predicate;

        // AND:
        // ====
        public and(queryExpression: (query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>;
        public and(other: TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>;
        public and(arg: ((query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>) | TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>
        {
            if (typeof arg === 'function')
                return this.and_function(<(query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>>arg);
            else
                return this.and_predicate(<TPredicate<TEntityQueryBuilder, TEntity>>arg);
        }

        private and_function(queryExpression: (query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return this.and_predicate(queryExpression(this.builder));
        }

        private and_predicate(other: TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TCompoundPredicate<TEntityQueryBuilder, TEntity>(this.builder, this, PredicateOps.AND, other);
        }

        // OR:
        // ====
        public or(queryExpression: (query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>;
        public or(other: TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>;
        public or(arg: ((query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>) | TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>
        {
            if (typeof arg === 'function')
                return this.or_function(<(query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>>arg);
            else
                return this.or_predicate(<TPredicate<TEntityQueryBuilder, TEntity>>arg);
        }

        private or_function(queryExpression: (query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return this.or_predicate(queryExpression(this.builder));
        }

        private or_predicate(other: TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TCompoundPredicate<TEntityQueryBuilder, TEntity>(this.builder, this, PredicateOps.OR, other);
        }

        // NOT:
        // ====
        public not(): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TCompoundPredicate<TEntityQueryBuilder, TEntity>(this.builder, this, PredicateOps.NOT, null);
        }
    }

    export class TSimplePredicate<TEntityQueryBuilder, TEntity> extends TPredicate<TEntityQueryBuilder, TEntity>
    {
        private fieldname: string;
        private comparison: string;
        private value: any;
        constructor(builder: TEntityQueryBuilder, fieldname: string, comparison: string, value: any)
        {
            super(builder);
            this.fieldname = fieldname;
            this.comparison = comparison;
            this.value = value;
        }

        public getBreezePredicate(): breeze.Predicate
        {
            return new breeze.Predicate(this.fieldname, this.comparison, this.and);
        }
    }

    export enum PredicateOps { AND, OR, NOT }

    export class TCompoundPredicate<TEntityQueryBuilder, TEntity> extends TPredicate<TEntityQueryBuilder, TEntity>
    {
        private p1: TPredicate<TEntityQueryBuilder, TEntity>;
        private op: PredicateOps;
        private p2: TPredicate<TEntityQueryBuilder, TEntity>;
        constructor(builder: TEntityQueryBuilder, p1: TPredicate<TEntityQueryBuilder, TEntity>, op: PredicateOps, p2: TPredicate<TEntityQueryBuilder, TEntity>)
        {
            super(builder);
            this.p1 = p1;
            this.op = op;
            this.p2 = p2;
        }

        public getBreezePredicate(): breeze.Predicate
        {
            switch (this.op)
            {
                case PredicateOps.AND:
                    return this.p1.getBreezePredicate().and(this.p2.getBreezePredicate());
                case PredicateOps.OR:
                    return this.p1.getBreezePredicate().or(this.p2.getBreezePredicate());
                case PredicateOps.NOT:
                    return this.p1.getBreezePredicate().not();
            }
        }
    }

    export class TRelatedPredicate<TEntityQueryBuilder, TEntity, TSubEntityQueryBuilder, TSubEntity> extends TPredicate<TEntityQueryBuilder, TEntity>
    {
        private fieldname: string;
        private operation: breeze.FilterQueryOpSymbol;
        private subPredicate: TPredicate<TSubEntityQueryBuilder, TSubEntity>;
        constructor(builder: TEntityQueryBuilder, fieldname: string, operation: breeze.FilterQueryOpSymbol, subPredicate: TPredicate<TSubEntityQueryBuilder, TSubEntity>)
        {
            super(builder);
            this.fieldname = fieldname;
            this.operation = operation;
            this.subPredicate = subPredicate;
        }

        public getBreezePredicate(): breeze.Predicate
        {
            return new breeze.Predicate(this.fieldname, this.operation, this.subPredicate.getBreezePredicate());
        }
    }

    export abstract class PrimitiveFieldInfo
    {
        public abstract getFieldName(): string;
    }

    export class NumberFieldInfo<TEntityQueryBuilder, TEntity> extends PrimitiveFieldInfo
    {
        private builder: TEntityQueryBuilder;
        private membername: string;
        constructor(builder: TEntityQueryBuilder, membername: string)
        {
            super();
            this.membername = membername;
            this.builder = builder;
        }

        public getFieldName(): string
        {
            return this.membername;
        }

        public equals(value: number): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "eq", value);
        }

        public lessThan(value: number): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "lt", value);
        }

        public greaterThan(value: number): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "gt", value);
        }
    }

    export class StringFieldInfo<TEntityQueryBuilder, TEntity> extends PrimitiveFieldInfo
    {
        private builder: TEntityQueryBuilder;
        private membername: string;
        constructor(builder: TEntityQueryBuilder, membername: string)
        {
            super();
            this.membername = membername;
            this.builder = builder;
        }

        public getFieldName(): string
        {
            return this.membername;
        }

        public equals(value: string): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "eq", value);
        }
    }

    export class BooleanFieldInfo<TEntityQueryBuilder, TEntity> extends PrimitiveFieldInfo
    {
        private builder: TEntityQueryBuilder;
        private membername: string;
        constructor(builder: TEntityQueryBuilder, membername: string)
        {
            super();
            this.membername = membername;
            this.builder = builder;
        }

        public getFieldName(): string
        {
            return this.membername;
        }

        public equals(value: boolean): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "eq", value);
        }

        public true(): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "eq", true);
        }

        public false(): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "eq", false);
        }
    }

    export class DateFieldInfo<TEntityQueryBuilder, TEntity> extends PrimitiveFieldInfo
    {
        private builder: TEntityQueryBuilder;
        private membername: string;
        constructor(builder: TEntityQueryBuilder, membername: string)
        {
            super();
            this.membername = membername;
            this.builder = builder;
        }

        public getFieldName(): string
        {
            return this.membername;
        }

        public equals(value: Date): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "eq", value);
        }

        public before(value: Date): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "<", value);
        }

        public notBefore(value: Date): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, ">=", value);
        }

        public after(value: Date): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, ">", value);
        }

        public notAfter(value: Date): TPredicate<TEntityQueryBuilder, TEntity>
        {
            return new TSimplePredicate<TEntityQueryBuilder, TEntity>(this.builder, this.membername, "<=", value);
        }
    }

    export class SingleAssociationFieldInfo<TEntityQueryBuilder, TEntity, TOtherEntityQueryBuilder, TOtherEntity>
    {
        private builder: TEntityQueryBuilder;
        private membername: string;
        constructor(builder: TEntityQueryBuilder, membername: string)
        {
            //super();
            this.membername = membername;
            this.builder = builder;
        }
    }

    export class MultiAssociationFieldInfo<TEntityQueryBuilder, TEntity, TOtherEntityQueryBuilder, TOtherEntity>
    {
        private builder: TEntityQueryBuilder;
        private otherBuilder: TOtherEntityQueryBuilder;
        private membername: string;
        constructor(builder: TEntityQueryBuilder, membername: string, otherBuilder: TOtherEntityQueryBuilder)
        {
            //super();
            this.membername = membername;
            this.builder = builder;
            this.otherBuilder = otherBuilder;
        }

        public any(querybuilder: (query: TOtherEntityQueryBuilder) => TPredicate<TOtherEntityQueryBuilder, TOtherEntity>): TPredicate<TEntityQueryBuilder, TEntity>
        {
            var subPredicate = querybuilder(this.otherBuilder);
            //new breeze.Predicate(this.membername, breeze.FilterQueryOp.Any, subPredicate.getBreezePredicate());
            return new TRelatedPredicate<TEntityQueryBuilder, TEntity, TOtherEntityQueryBuilder, TOtherEntity>(this.builder, this.membername, breeze.FilterQueryOp.Any, subPredicate);
        }
    }
}
