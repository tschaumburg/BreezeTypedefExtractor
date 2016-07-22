/// <reference path="../typings/index.d.ts" />
declare module dk.schaumburgit.breezeextensions {
    class TEntityQuery<TEntityQueryBuilder, TEntity> {
        private _entitymanager;
        private rootname;
        private rootinfo;
        private predicate;
        private _orderBy;
        constructor(_entityManager: breeze.EntityManager, rootname: string, rootinfo: TEntityQueryBuilder, predicate: TPredicate<TEntityQueryBuilder, TEntity>, orderBy: PrimitiveFieldInfo);
        execute(): breeze.promises.IPromise<TEntity[]>;
        orderBy(fieldSelector: (query: TEntityQueryBuilder) => PrimitiveFieldInfo): TEntityQuery<TEntityQueryBuilder, TEntity>;
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
        where(condition: TPredicate<TEntityQueryBuilder, TEntity>): TEntityQuery<TEntityQueryBuilder, TEntity>;
        /**
         * Filters
         * @param queryExpression
         */
        where(queryExpression: (query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>): TEntityQuery<TEntityQueryBuilder, TEntity>;
        private where_predicate(predicate);
        private where_function(queryExpression);
    }
    abstract class TPredicate<TEntityQueryBuilder, TEntity> {
        private builder;
        constructor(builder: TEntityQueryBuilder);
        abstract getBreezePredicate(): breeze.Predicate;
        and(queryExpression: (query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>;
        and(other: TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>;
        private and_function(queryExpression);
        private and_predicate(other);
        or(queryExpression: (query: TEntityQueryBuilder) => TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>;
        or(other: TPredicate<TEntityQueryBuilder, TEntity>): TPredicate<TEntityQueryBuilder, TEntity>;
        private or_function(queryExpression);
        private or_predicate(other);
        not(): TPredicate<TEntityQueryBuilder, TEntity>;
    }
    class TSimplePredicate<TEntityQueryBuilder, TEntity> extends TPredicate<TEntityQueryBuilder, TEntity> {
        private fieldname;
        private comparison;
        private value;
        constructor(builder: TEntityQueryBuilder, fieldname: string, comparison: string, value: any);
        getBreezePredicate(): breeze.Predicate;
    }
    enum PredicateOps {
        AND = 0,
        OR = 1,
        NOT = 2,
    }
    class TCompoundPredicate<TEntityQueryBuilder, TEntity> extends TPredicate<TEntityQueryBuilder, TEntity> {
        private p1;
        private op;
        private p2;
        constructor(builder: TEntityQueryBuilder, p1: TPredicate<TEntityQueryBuilder, TEntity>, op: PredicateOps, p2: TPredicate<TEntityQueryBuilder, TEntity>);
        getBreezePredicate(): breeze.Predicate;
    }
    class TRelatedPredicate<TEntityQueryBuilder, TEntity, TSubEntityQueryBuilder, TSubEntity> extends TPredicate<TEntityQueryBuilder, TEntity> {
        private fieldname;
        private operation;
        private subPredicate;
        constructor(builder: TEntityQueryBuilder, fieldname: string, operation: breeze.FilterQueryOpSymbol, subPredicate: TPredicate<TSubEntityQueryBuilder, TSubEntity>);
        getBreezePredicate(): breeze.Predicate;
    }
    abstract class PrimitiveFieldInfo {
        abstract getFieldName(): string;
    }
    class NumberFieldInfo<TEntityQueryBuilder, TEntity> extends PrimitiveFieldInfo {
        private builder;
        private membername;
        constructor(builder: TEntityQueryBuilder, membername: string);
        getFieldName(): string;
        equals(value: number): TPredicate<TEntityQueryBuilder, TEntity>;
        lessThan(value: number): TPredicate<TEntityQueryBuilder, TEntity>;
        greaterThan(value: number): TPredicate<TEntityQueryBuilder, TEntity>;
    }
    class StringFieldInfo<TEntityQueryBuilder, TEntity> extends PrimitiveFieldInfo {
        private builder;
        private membername;
        constructor(builder: TEntityQueryBuilder, membername: string);
        getFieldName(): string;
        equals(value: string): TPredicate<TEntityQueryBuilder, TEntity>;
    }
    class BooleanFieldInfo<TEntityQueryBuilder, TEntity> extends PrimitiveFieldInfo {
        private builder;
        private membername;
        constructor(builder: TEntityQueryBuilder, membername: string);
        getFieldName(): string;
        equals(value: boolean): TPredicate<TEntityQueryBuilder, TEntity>;
        true(): TPredicate<TEntityQueryBuilder, TEntity>;
        false(): TPredicate<TEntityQueryBuilder, TEntity>;
    }
    class DateFieldInfo<TEntityQueryBuilder, TEntity> extends PrimitiveFieldInfo {
        private builder;
        private membername;
        constructor(builder: TEntityQueryBuilder, membername: string);
        getFieldName(): string;
        equals(value: Date): TPredicate<TEntityQueryBuilder, TEntity>;
        before(value: Date): TPredicate<TEntityQueryBuilder, TEntity>;
        notBefore(value: Date): TPredicate<TEntityQueryBuilder, TEntity>;
        after(value: Date): TPredicate<TEntityQueryBuilder, TEntity>;
        notAfter(value: Date): TPredicate<TEntityQueryBuilder, TEntity>;
    }
    class SingleAssociationFieldInfo<TEntityQueryBuilder, TEntity, TOtherEntityQueryBuilder, TOtherEntity> {
        private builder;
        private membername;
        constructor(builder: TEntityQueryBuilder, membername: string);
    }
    class MultiAssociationFieldInfo<TEntityQueryBuilder, TEntity, TOtherEntityQueryBuilder, TOtherEntity> {
        private builder;
        private otherBuilder;
        private membername;
        constructor(builder: TEntityQueryBuilder, membername: string, otherBuilder: TOtherEntityQueryBuilder);
        any(querybuilder: (query: TOtherEntityQueryBuilder) => TPredicate<TOtherEntityQueryBuilder, TOtherEntity>): TPredicate<TEntityQueryBuilder, TEntity>;
    }
}
