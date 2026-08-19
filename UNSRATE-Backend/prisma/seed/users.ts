import { PrismaClient, Gender } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/id_ID';
import * as bcrypt from 'bcrypt';

// University faculties and programs
const faculties = [
  { name: 'Fakultas Ilmu Komputer', programs: ['Teknik Informatika', 'Sistem Informasi', 'Data Science'] },
  { name: 'Fakultas Ekonomi', programs: ['Manajemen', 'Akuntansi', 'Ekonomi Pembangunan'] },
  { name: 'Fakultas Teknik', programs: ['Teknik Sipil', 'Teknik Elektro', 'Teknik Mesin'] },
  { name: 'Fakultas Hukum', programs: ['Ilmu Hukum'] },
  { name: 'Fakultas Kedokteran', programs: ['Pendidikan Dokter', 'Farmasi', 'Gizi'] },
  { name: 'Fakultas Psikologi', programs: ['Psikologi'] }
];

/**
 * Generate and create university student users
 */
export async function seedUsers(prisma: PrismaClient, count = 10) {
  const hashedPassword = await bcrypt.hash('123456', 10);
  const users = [];
  
  console.log(`Generating ${count} users...`);
  
  // Create 5 male users
  for (let i = 0; i < count / 2; i++) {
    const gender = Gender.MALE;
    const faculty = faker.helpers.arrayElement(faculties);
    const program = faker.helpers.arrayElement(faculty.programs);
    const birthYear = faker.number.int({ min: 1998, max: 2005 });
    const birthDate = new Date(birthYear, faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 }));
    const age = new Date().getFullYear() - birthYear;
    
    const nim = `M${faker.string.numeric(9)}`;
    const email = `test${users.length + 1}@gmail.com`; // MODIFIED: Simplified email

    users.push({
      fullname: faker.person.fullName({ sex: 'male' }),
      nim,
      email, // MODIFIED: Use simplified email
      password: hashedPassword,
      profilePicture: null,
      Photos: [],
      bio: faker.helpers.maybe(() => faker.lorem.paragraph(1), { probability: 0.7 }),
      fakultas: faculty.name,
      prodi: program,
      dateOfBirth: birthDate,
      age,
      gender,
      alamat: faker.location.streetAddress(),
      interestedInGender: Gender.FEMALE,
      minAgePreference: faker.helpers.maybe(() => faker.number.int({ min: 18, max: 23 }), { probability: 0.7 }),
      maxAgePreference: faker.helpers.maybe(() => faker.number.int({ min: 19, max: 25 }), { probability: 0.7 }),
      verified: true,
      isActive: true
    });
  }

  // Create 5 female users
  for (let i = 0; i < count / 2; i++) {
    const gender = Gender.FEMALE;
    const faculty = faker.helpers.arrayElement(faculties);
    const program = faker.helpers.arrayElement(faculty.programs);
    const birthYear = faker.number.int({ min: 1998, max: 2005 });
    const birthDate = new Date(birthYear, faker.number.int({ min: 0, max: 11 }), faker.number.int({ min: 1, max: 28 }));
    const age = new Date().getFullYear() - birthYear;
    
    const nim = `F${faker.string.numeric(9)}`;
    const email = `test${users.length + 1}@gmail.com`; // MODIFIED: Simplified email
    
    users.push({
      fullname: faker.person.fullName({ sex: 'female' }),
      nim,
      email, // MODIFIED: Use simplified email
      password: hashedPassword,
      profilePicture: null,
      Photos: [],
      bio: faker.helpers.maybe(() => faker.lorem.paragraph(1), { probability: 0.7 }),
      fakultas: faculty.name,
      prodi: program,
      dateOfBirth: birthDate,
      age,
      gender,
      alamat: faker.location.streetAddress(),
      interestedInGender: Gender.MALE,
      minAgePreference: faker.helpers.maybe(() => faker.number.int({ min: 18, max: 23 }), { probability: 0.7 }),
      maxAgePreference: faker.helpers.maybe(() => faker.number.int({ min: 19, max: 25 }), { probability: 0.7 }),
      verified: true,
      isActive: true
    });
  }
  
  // Create users in batches to improve performance
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await prisma.user.createMany({
      data: batch,
      skipDuplicates: true
    });
  }
  
  console.log(`Created ${users.length} users`);
  return await prisma.user.findMany();
}