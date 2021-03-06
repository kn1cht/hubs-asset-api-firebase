'use strict';

const admin = require('firebase-admin');
admin.initializeApp();

class Store {
  constructor() {
    this.db = admin.firestore();
  }

  async getDocInCollection(cName, dName) {
    const doc = await this.db.doc(`${cName}/${dName}`)
      .get().catch((err) => console.error(err));
    return (doc.exists ? doc.data() : {});
  }

  async setDocInCollection(cName, dName, data) {
    await this.db.doc(`${cName}/${dName}`)
      .set(data).catch((err) => {
        console.error(err);
        return false;
      });
    return true;
  }
}

module.exports = Store;
