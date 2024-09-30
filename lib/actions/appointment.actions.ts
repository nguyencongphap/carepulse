"use server";
// must explitcitly use "use server" in order for env var set to client's config available.
// users uses client's configs
// This file is our server actions file

import { ID, Query } from "node-appwrite";
import {
  databases,
  DATABASE_ID,
  PATIENT_COLLECTION_ID,
  ENDPOINT,
  BUCKET_ID,
  PROJECT_ID,
  APPOINTMENT_COLLECTION_ID,
  messaging,
} from "../appwrite.config";
import { formatDateTime, parseStringify } from "../utils";
import { Appointment } from "@/types/appwrite.types";
import { revalidatePath } from "next/cache";

export const createAppointment = async (
  appointment: CreateAppointmentParams
) => {
  try {
    // Create a patient document
    const newAppointment = await databases.createDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      ID.unique(),
      appointment
    );

    return parseStringify(newAppointment);
  } catch (error) {
    console.log(error);
  }
};

export const getAppointment = async (appointmentId: string) => {
  try {
    const appointment = await databases.getDocument(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      appointmentId
    );

    return parseStringify(appointment);
  } catch (error) {
    console.log(error);
  }
};

export const getRecentAppointmentList = async () => {
  try {
    const appointments = await databases.listDocuments(
      DATABASE_ID!,
      APPOINTMENT_COLLECTION_ID!,
      [Query.orderDesc("$createdAt")] // TODO: this makes the query returns only the 2 oldest data rows for some reasons
    );

    const initialCounts = {
      scheduledCount: 0,
      pendingCount: 0,
      cancelledCount: 0,
    };

    const counts = (appointments.documents as Appointment[]).reduce(
      (acc, appointment) => {
        if (appointment.status === "scheduled") {
          acc.scheduledCount += 1;
        } else if (appointment.status === "pending") {
          acc.pendingCount += 1;
        } else if (appointment.status === "cancelled") {
          acc.cancelledCount += 1;
        }

        return acc;
      },
      initialCounts
    );

    const data = {
      totalCount: appointments.total,
      ...counts,
      documents: appointments.documents,
    };

    return parseStringify(data);
  } catch (error) {
    console.log(error);
  }
};

export const updateAppointment = async ({
  appointmentId,
  userId,
  appointment,
  type,
}: UpdateAppointmentParams) => {
  try {
    // Need to pass info of db and table in which the document exists
    const updatedAppointment = await databases.updateDocument(
      DATABASE_ID!, // db id on appwrite
      APPOINTMENT_COLLECTION_ID!, // table id on appwrite
      appointmentId, // id of record we want to update
      appointment // data to use to overwrite existing record
    );

    if (!updatedAppointment) {
      throw new Error("Appointment not found");
    }

    // SMS notification
    const smsMessage = `Hi, it's CarePulse. ${
      type === "schedule"
        ? `Your appointment has been scheduled for ${
            formatDateTime(appointment.schedule!).dateTime
          } with Dr. ${appointment.primaryPhysician}`
        : `We regret to inform you that your appointment has been cancelled for the following reason: ${appointment.cancellationReason}`
    }.`;

    await sendSMSNotification(userId, smsMessage);

    // update the admin route so the changes are reflected
    revalidatePath("/admin");
    return parseStringify(updatedAppointment);
  } catch (error) {
    console.log(error);
  }
};

export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    const message = await messaging.createSms(
      ID.unique(),
      content,
      [],
      [userId]
    );

    // return to frontend
    return parseStringify(message);
  } catch (error) {
    console.log(error);
  }
};
