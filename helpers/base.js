const SIZE = 100;
const INDEX = '_id';
const SORT = { createdAt: 1 };

class CBase {

  constructor(model, size = SIZE, sort = SORT) {
    this.model = model;
    this.size = size;
    this.sort = sort;
  }

  List(query, callback) {
    this.model.Find(query, callback, {}, {}, this.size, SORT);
  }

  GetOne(query, callback) {
    this.model.FindOne(query, callback);
  }

  FindById(id, callback) {
    this.model.FindByObjectId(this._buildQueryByIndex(id), INDEX, callback);
  }

  Create(query, callback) {
    this.model.Insert(query, callback);
  }

  Update(query, doc, callback) {
    this.model.Update(query, doc, { w: 1 }, callback);
  }

  UpdateById(id, doc, callback) {
    this.model.UpdateByObjectId(this._buildQueryByIndex(id), doc, INDEX, callback);
  }

  UpdateByIdAndQuery(id, doc, query, callback) {
    this.model.UpdateByObjectId(this._buildQueryByIndex(id, query), doc, INDEX, callback);
  }

  Delete(query, callback) {
    this.model.Remove(query, callback);
  }

  DeleteById(id, callback) {
    this.model.RemoveByObjectId(this._buildQueryByIndex(id), INDEX, callback);
  }

  IncById(id, key, qty, callback) {
    const doc = { $inc: {} };
    doc.$inc[key] = qty;
    this.model.UpdateByObjectId(this._buildQueryByIndex(id), doc, INDEX, callback);
  }

  Aggregate(query, callback) {
    this.model.Aggregate(query, callback);
  }

  _buildQueryByIndex(id, query = {}) {
    return Object.assign(query, { INDEX: id });
  }

}

module.exports = CBase;