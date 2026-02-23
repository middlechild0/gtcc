
import { db } from "./client";
import { locations } from "./schema";

const KENYA_LOCATIONS = [
    { name: "Westlands, Nairobi", county: "Nairobi" },
    { name: "Kilimani, Nairobi", county: "Nairobi" },
    { name: "Karen, Nairobi", county: "Nairobi" },
    { name: "Lavington, Nairobi", county: "Nairobi" },
    { name: "Runda, Nairobi", county: "Nairobi" },
    { name: "Muthaiga, Nairobi", county: "Nairobi" },
    { name: "Nyali, Mombasa", county: "Mombasa" },
    { name: "Diani, Kwale", county: "Kwale" },
    { name: "Milimani, Kisumu", county: "Kisumu" },
    { name: "Nakuru Town", county: "Nakuru" },
    { name: "Eldoret", county: "Uasin Gishu" },
    { name: "Thika", county: "Kiambu" },
    { name: "Kiambu Road, Kiambu", county: "Kiambu" },
    { name: "Ruaka, Kiambu", county: "Kiambu" },
    { name: "Kitengela, Kajiado", county: "Kajiado" },
    { name: "Ngong, Kajiado", county: "Kajiado" },
    { name: "Ongata Rongai, Kajiado", county: "Kajiado" },
    { name: "Syokimau, Machakos", county: "Machakos" },
    { name: "Athi River, Machakos", county: "Machakos" },
];

async function seed() {
    console.log("Seeding locations...");
    try {
        await db.insert(locations).values(KENYA_LOCATIONS).onConflictDoNothing();
        console.log("Seeding complete.");
    } catch (e) {
        console.error("Error seeding:", e);
    }
    process.exit(0);
}

seed();
