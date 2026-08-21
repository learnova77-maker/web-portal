import { rtdb } from "./firebase";
import { ref, push, set } from "firebase/database";

export async function seedSampleData() {
    try {
        const usersRef = ref(rtdb, "users");

        // Sample Teachers
        const sampleTeachers = [
            {
                name: "Dr. Sarah Johnson",
                email: "sarah.j@learnova.edu",
                subject: "Artificial Intelligence",
                status: "approved",
                qualifications: "Ph.D. in Computer Science",
                experience: "12 Years",
                joinedDate: "Mar 12, 2024"
            },
            {
                name: "Prof. Michael Chen",
                email: "m.chen@learnova.edu",
                subject: "Quantum Physics",
                status: "pending",
                qualifications: "M.Sc. Physics",
                experience: "8 Years",
                joinedDate: "Mar 28, 2024"
            },
            {
                name: "Ms. Emily Davis",
                email: "emily.d@learnova.edu",
                subject: "Modern History",
                status: "approved",
                qualifications: "MA in History",
                experience: "5 Years",
                joinedDate: "Feb 15, 2024"
            }
        ];

        // Sample Students
        const sampleStudents = [
            {
                name: "Alex Rivera",
                email: "alex.r@gmail.com",
                grade: "Grade 12",
                joinedAt: "Jan 2024"
            },
            {
                name: "Sophia Lee",
                email: "sophia.l@outlook.com",
                grade: "Grade 10",
                joinedAt: "Feb 2024"
            }
        ];

        console.log("Seeding data to Realtime Database...");

        for (const teacher of sampleTeachers) {
            const newRef = push(usersRef);
            await set(newRef, {
                role: "teacher",
                fullName: teacher.name,
                email: teacher.email,
                expertise: teacher.subject,
                status: teacher.status,
                qualifications: teacher.qualifications,
                experience: teacher.experience,
                joinedDate: teacher.joinedDate,
                createdAt: Date.now()
            });
        }

        for (const student of sampleStudents) {
            const newRef = push(usersRef);
            await set(newRef, {
                role: "student",
                fullName: student.name,
                email: student.email,
                grade: student.grade,
                joinedDate: student.joinedAt,
                createdAt: Date.now()
            });
        }

        console.log("Seeding complete!");
        return true;
    } catch (error) {
        console.error("Error seeding data:", error);
        throw error;
    }
}
