import {Storage} from "@google-cloud/storage"

let storage = new Storage({credentials: JSON.parse(process.env.google_credentials_json)})

export default storage.bucket(process.env.bucket_name)
