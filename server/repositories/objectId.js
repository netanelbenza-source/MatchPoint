const { ObjectId } = require('mongodb');

function toObjectId(id) {
  if (!ObjectId.isValid(id)) {
    const error = new Error('Invalid id');
    error.statusCode = 400;
    throw error;
  }
  return new ObjectId(id);
}

module.exports = {
  toObjectId,
};
