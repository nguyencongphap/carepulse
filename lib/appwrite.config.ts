import * as sdk from "node-appwrite";

export const {
  PROJECT_ID,
  API_KEY,
  DATABASE_ID,
  PATIENT_COLLECTION_ID,
  DOCTOR_COLLECTION_ID,
  APPOINTMENT_COLLECTION_ID,
  NEXT_PUBLIC_BUCKET_ID: BUCKET_ID,
  NEXT_PUBLIC_ENDPOINT: ENDPOINT,
} = process.env;

export const client = new sdk.Client()
  .setEndpoint(ENDPOINT!) // ! is to say "hey, it actually exists" and suppress the warning
  .setProject(PROJECT_ID!)
  .setKey(API_KEY!);

// export different functionalities coming from that client
export const databases = new sdk.Databases(client);
export const storage = new sdk.Storage(client);
export const messaging = new sdk.Messaging(client);
export const users = new sdk.Users(client); // for authentication
