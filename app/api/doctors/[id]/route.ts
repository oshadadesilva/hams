import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Doctor from "@/models/Doctor";


export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await connectDB();

        const doctors = await Doctor.find().sort({ name: 1 }).lean();
        if (doctors.length === 0) {
            return NextResponse.json(
                { success: false, message: "No doctors found." },
                { status: 404 }
            );
        }

        doctors.forEach((doc) => console.log("Doctor ID:", doc._id, "Name:", doc.name));
        const doctor = doctors.find((doc) => String(doc._id) === id);
        console.log("Searching for doctor with ID:", id);
        console.log("Fetched doctor:", doctor);


        if (!doctor) {
            return NextResponse.json(
                { success: false, message: `Doctor with ID "${id}" not found.` },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, doctor });
    } catch (error) {
        console.error("Failed to fetch doctor:", error);
        return NextResponse.json(
            { success: false, message: "Unable to load doctor.", error: String(error) },
            { status: 500 }
        );
    }
}