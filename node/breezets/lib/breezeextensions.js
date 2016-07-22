var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
///<reference path='../typings/index.d.ts' />
var dk;
(function (dk) {
    var schaumburgit;
    (function (schaumburgit) {
        var breezeextensions;
        (function (breezeextensions) {
            var TEntityQuery = (function () {
                function TEntityQuery(_entityManager, rootname, rootinfo, predicate, orderBy) {
                    this._entitymanager = null;
                    this.rootname = null;
                    this.rootinfo = null;
                    this.predicate = null;
                    this._orderBy = null;
                    //super();
                    this.rootname = rootname;
                    this.rootinfo = rootinfo;
                    this.predicate = predicate;
                    this._orderBy = orderBy;
                    this._entitymanager = _entityManager;
                }
                TEntityQuery.prototype.execute = function () {
                    var breezeQuery = breeze.EntityQuery.from(this.rootname);
                    if (this.predicate != null)
                        breezeQuery = breezeQuery.where(this.predicate.getBreezePredicate());
                    if (this._orderBy != null)
                        breezeQuery = breezeQuery.orderBy(this._orderBy.getFieldName());
                    return this._entitymanager.executeQuery(breezeQuery).then(function (dt) { return dt.results; });
                };
                TEntityQuery.prototype.orderBy = function (fieldSelector) {
                    var field = fieldSelector(this.rootinfo);
                    return new TEntityQuery(this._entitymanager, this.rootname, this.rootinfo, this.predicate, field);
                };
                TEntityQuery.prototype.where = function (arg) {
                    if (typeof arg === 'function')
                        return this.where_function(arg);
                    else
                        return this.where_predicate(arg);
                };
                TEntityQuery.prototype.where_predicate = function (predicate) {
                    var newPredicate = predicate;
                    if (this.predicate != null)
                        newPredicate = this.predicate.and(predicate);
                    return new TEntityQuery(this._entitymanager, this.rootname, this.rootinfo, predicate, this._orderBy);
                };
                TEntityQuery.prototype.where_function = function (queryExpression) {
                    var predicate = queryExpression(this.rootinfo);
                    return this.where_predicate(predicate);
                };
                return TEntityQuery;
            }());
            breezeextensions.TEntityQuery = TEntityQuery;
            var TPredicate = (function () {
                function TPredicate(builder) {
                    this.builder = builder;
                }
                TPredicate.prototype.and = function (arg) {
                    if (typeof arg === 'function')
                        return this.and_function(arg);
                    else
                        return this.and_predicate(arg);
                };
                TPredicate.prototype.and_function = function (queryExpression) {
                    return this.and_predicate(queryExpression(this.builder));
                };
                TPredicate.prototype.and_predicate = function (other) {
                    return new TCompoundPredicate(this.builder, this, PredicateOps.AND, other);
                };
                TPredicate.prototype.or = function (arg) {
                    if (typeof arg === 'function')
                        return this.or_function(arg);
                    else
                        return this.or_predicate(arg);
                };
                TPredicate.prototype.or_function = function (queryExpression) {
                    return this.or_predicate(queryExpression(this.builder));
                };
                TPredicate.prototype.or_predicate = function (other) {
                    return new TCompoundPredicate(this.builder, this, PredicateOps.OR, other);
                };
                // NOT:
                // ====
                TPredicate.prototype.not = function () {
                    return new TCompoundPredicate(this.builder, this, PredicateOps.NOT, null);
                };
                return TPredicate;
            }());
            breezeextensions.TPredicate = TPredicate;
            var TSimplePredicate = (function (_super) {
                __extends(TSimplePredicate, _super);
                function TSimplePredicate(builder, fieldname, comparison, value) {
                    _super.call(this, builder);
                    this.fieldname = fieldname;
                    this.comparison = comparison;
                    this.value = value;
                }
                TSimplePredicate.prototype.getBreezePredicate = function () {
                    return new breeze.Predicate(this.fieldname, this.comparison, this.and);
                };
                return TSimplePredicate;
            }(TPredicate));
            breezeextensions.TSimplePredicate = TSimplePredicate;
            (function (PredicateOps) {
                PredicateOps[PredicateOps["AND"] = 0] = "AND";
                PredicateOps[PredicateOps["OR"] = 1] = "OR";
                PredicateOps[PredicateOps["NOT"] = 2] = "NOT";
            })(breezeextensions.PredicateOps || (breezeextensions.PredicateOps = {}));
            var PredicateOps = breezeextensions.PredicateOps;
            var TCompoundPredicate = (function (_super) {
                __extends(TCompoundPredicate, _super);
                function TCompoundPredicate(builder, p1, op, p2) {
                    _super.call(this, builder);
                    this.p1 = p1;
                    this.op = op;
                    this.p2 = p2;
                }
                TCompoundPredicate.prototype.getBreezePredicate = function () {
                    switch (this.op) {
                        case PredicateOps.AND:
                            return this.p1.getBreezePredicate().and(this.p2.getBreezePredicate());
                        case PredicateOps.OR:
                            return this.p1.getBreezePredicate().or(this.p2.getBreezePredicate());
                        case PredicateOps.NOT:
                            return this.p1.getBreezePredicate().not();
                    }
                };
                return TCompoundPredicate;
            }(TPredicate));
            breezeextensions.TCompoundPredicate = TCompoundPredicate;
            var TRelatedPredicate = (function (_super) {
                __extends(TRelatedPredicate, _super);
                function TRelatedPredicate(builder, fieldname, operation, subPredicate) {
                    _super.call(this, builder);
                    this.fieldname = fieldname;
                    this.operation = operation;
                    this.subPredicate = subPredicate;
                }
                TRelatedPredicate.prototype.getBreezePredicate = function () {
                    return new breeze.Predicate(this.fieldname, this.operation, this.subPredicate.getBreezePredicate());
                };
                return TRelatedPredicate;
            }(TPredicate));
            breezeextensions.TRelatedPredicate = TRelatedPredicate;
            var PrimitiveFieldInfo = (function () {
                function PrimitiveFieldInfo() {
                }
                return PrimitiveFieldInfo;
            }());
            breezeextensions.PrimitiveFieldInfo = PrimitiveFieldInfo;
            var NumberFieldInfo = (function (_super) {
                __extends(NumberFieldInfo, _super);
                function NumberFieldInfo(builder, membername) {
                    _super.call(this);
                    this.membername = membername;
                    this.builder = builder;
                }
                NumberFieldInfo.prototype.getFieldName = function () {
                    return this.membername;
                };
                NumberFieldInfo.prototype.equals = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, "eq", value);
                };
                NumberFieldInfo.prototype.lessThan = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, "lt", value);
                };
                NumberFieldInfo.prototype.greaterThan = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, "gt", value);
                };
                return NumberFieldInfo;
            }(PrimitiveFieldInfo));
            breezeextensions.NumberFieldInfo = NumberFieldInfo;
            var StringFieldInfo = (function (_super) {
                __extends(StringFieldInfo, _super);
                function StringFieldInfo(builder, membername) {
                    _super.call(this);
                    this.membername = membername;
                    this.builder = builder;
                }
                StringFieldInfo.prototype.getFieldName = function () {
                    return this.membername;
                };
                StringFieldInfo.prototype.equals = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, "eq", value);
                };
                return StringFieldInfo;
            }(PrimitiveFieldInfo));
            breezeextensions.StringFieldInfo = StringFieldInfo;
            var BooleanFieldInfo = (function (_super) {
                __extends(BooleanFieldInfo, _super);
                function BooleanFieldInfo(builder, membername) {
                    _super.call(this);
                    this.membername = membername;
                    this.builder = builder;
                }
                BooleanFieldInfo.prototype.getFieldName = function () {
                    return this.membername;
                };
                BooleanFieldInfo.prototype.equals = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, "eq", value);
                };
                BooleanFieldInfo.prototype.true = function () {
                    return new TSimplePredicate(this.builder, this.membername, "eq", true);
                };
                BooleanFieldInfo.prototype.false = function () {
                    return new TSimplePredicate(this.builder, this.membername, "eq", false);
                };
                return BooleanFieldInfo;
            }(PrimitiveFieldInfo));
            breezeextensions.BooleanFieldInfo = BooleanFieldInfo;
            var DateFieldInfo = (function (_super) {
                __extends(DateFieldInfo, _super);
                function DateFieldInfo(builder, membername) {
                    _super.call(this);
                    this.membername = membername;
                    this.builder = builder;
                }
                DateFieldInfo.prototype.getFieldName = function () {
                    return this.membername;
                };
                DateFieldInfo.prototype.equals = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, "eq", value);
                };
                DateFieldInfo.prototype.before = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, "<", value);
                };
                DateFieldInfo.prototype.notBefore = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, ">=", value);
                };
                DateFieldInfo.prototype.after = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, ">", value);
                };
                DateFieldInfo.prototype.notAfter = function (value) {
                    return new TSimplePredicate(this.builder, this.membername, "<=", value);
                };
                return DateFieldInfo;
            }(PrimitiveFieldInfo));
            breezeextensions.DateFieldInfo = DateFieldInfo;
            var SingleAssociationFieldInfo = (function () {
                function SingleAssociationFieldInfo(builder, membername) {
                    //super();
                    this.membername = membername;
                    this.builder = builder;
                }
                return SingleAssociationFieldInfo;
            }());
            breezeextensions.SingleAssociationFieldInfo = SingleAssociationFieldInfo;
            var MultiAssociationFieldInfo = (function () {
                function MultiAssociationFieldInfo(builder, membername, otherBuilder) {
                    //super();
                    this.membername = membername;
                    this.builder = builder;
                    this.otherBuilder = otherBuilder;
                }
                MultiAssociationFieldInfo.prototype.any = function (querybuilder) {
                    var subPredicate = querybuilder(this.otherBuilder);
                    //new breeze.Predicate(this.membername, breeze.FilterQueryOp.Any, subPredicate.getBreezePredicate());
                    return new TRelatedPredicate(this.builder, this.membername, breeze.FilterQueryOp.Any, subPredicate);
                };
                return MultiAssociationFieldInfo;
            }());
            breezeextensions.MultiAssociationFieldInfo = MultiAssociationFieldInfo;
        })(breezeextensions = schaumburgit.breezeextensions || (schaumburgit.breezeextensions = {}));
    })(schaumburgit = dk.schaumburgit || (dk.schaumburgit = {}));
})(dk || (dk = {}));
//# sourceMappingURL=breezeextensions.js.map