import { PrismaClient } from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { generateId } from 'lucia';
import 'dotenv/config';

const prisma = new PrismaClient();

async function createAdmin() {
	try {
		const username = process.argv[2] || 'admin';
		const email = process.argv[3] || 'admin@hs-mannheim.de';
		const password = process.argv[4] || generatePassword();

		console.log('\nCreating admin user...');
		console.log('Username:', username);
		console.log('Email:', email);
		console.log('Password:', password);
		console.log('\n⚠️  SAVE THIS PASSWORD - it will only be shown once!\n');

		const hashedPassword = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		const user = await prisma.user.create({
			data: {
				id: generateId(10),
				username: username,
				email: email,
				passwordHash: hashedPassword,
				protected: true
			}
		});

		console.log('✅ Admin user created successfully!');
		console.log('ID:', user.id);
		console.log('\nYou can now login with:');
		console.log('Username:', username);
		console.log('Password:', password);
		console.log('\n');

	} catch (error) {
		console.error('❌ Error creating admin user:', error.message);
		if (error.code === 'P2002') {
			console.error('A user with this username or email already exists.');
		}
	} finally {
		await prisma.$disconnect();
	}
}

function generatePassword() {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
	let password = '';
	for (let i = 0; i < 16; i++) {
		password += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return password;
}

createAdmin();
