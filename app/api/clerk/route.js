// import { createUser, deleteUser, updateUser } from "@/actions/user";
// import { headers } from "next/headers";
// import { Webhook } from "svix";

// export async function POST(req) {
//   console.log("Incoming Clerk data:", JSON.stringify(req.body, null, 2));

//   const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

//   if (!WEBHOOK_SECRET) {
//     throw new Error(
//       "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
//     );
//   }

//   // Get the headers
//   const headerPayload = headers();
//   const svix_id = headerPayload.get("svix-id");
//   const svix_timestamp = headerPayload.get("svix-timestamp");
//   const svix_signature = headerPayload.get("svix-signature");

//   // If there are no headers, error out
//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     return new Response("Error occured -- no svix headers", {
//       status: 400,
//     });
//   }

//   // Get the body
//   const payload = await req.json();
//   const body = JSON.stringify(payload);

//   // Create a new Svix instance with your secret.
//   const wh = new Webhook(WEBHOOK_SECRET);

//   let evt;

//   // Verify the payload with the headers
//   try {
//     evt = wh.verify(body, {
//       "svix-id": svix_id,
//       "svix-timestamp": svix_timestamp,
//       "svix-signature": svix_signature,
//     });
//   } catch (err) {
//     console.error("Error verifying webhook:", err);
//     return new Response("Error occured", {
//       status: 400,
//     });
//   }

//   // Get the ID and type
//   const eventType = evt.type;

//   const { id, first_name, last_name, email_addresses, image_url, username } = evt.data;

//   const email_address = email_addresses?.[0].email_address;

//   console.log("event received")
//   if (eventType === "user.created") {
//     try {
//       await createUser({ id, first_name, last_name, email_address, image_url, username });
//     } catch {
//       throw new Error("Failed to save new user in db");
//     }
//   }

//   if (eventType === "user.updated") {
//     try {
//       await updateUser({ id, first_name, last_name, email_address, image_url, username });
//     } catch {
//       throw new Error("Failed to update user in db");
//     }
//   }

//   if(eventType === "user.deleted") {
//     try {
//       await deleteUser({ id });
//     } catch {
//       throw new Error("Failed to delete user in db");
//     }
//   }

//   return Response.json({ message: "received" });
// }

// export async function GET() {
//   return Response.json({ message: "Hello World!" });
// }

import { createUser, deleteUser, updateUser } from "@/actions/user";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET to .env.local");
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  console.log("Incoming Clerk data:", JSON.stringify(payload, null, 2));
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Webhook verification failed", { status: 400 });
  }

  const eventType = evt.type;
  const { id, first_name, last_name, email_addresses, image_url, username } =
    evt.data;
  const email_address = email_addresses?.[0]?.email_address ?? "";

  try {
    if (eventType === "user.created") {
      await createUser({
        id,
        first_name,
        last_name,
        email_address,
        image_url,
        username,
      });
      console.log("User successfully created in DB");
    } else if (eventType === "user.updated") {
      await updateUser({
        id,
        first_name,
        last_name,
        email_address,
        image_url,
        username,
      });
      console.log("User successfully updated in DB");
    } else if (eventType === "user.deleted") {
      await deleteUser(id);
      console.log("User successfully deleted in DB");
    }
  } catch (err) {
    console.error("Error handling event:", eventType, err);
    return new Response("Failed to handle event", { status: 500 });
  }

  return Response.json({ message: "received" });
}
