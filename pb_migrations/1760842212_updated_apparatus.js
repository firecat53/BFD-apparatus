/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2191439077")

  // add field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "bool2544042721",
    "name": "oos",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2191439077")

  // remove field
  collection.fields.removeById("bool2544042721")

  return app.save(collection)
})
