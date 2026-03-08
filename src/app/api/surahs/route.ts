import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { surahs } from '@/lib/surahs';

export async function GET() {
    try {
        const connection = await pool.getConnection();

        // Ensure table exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS surahs (
                number INT PRIMARY KEY,
                name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
                englishName VARCHAR(255),
                englishNameTranslation VARCHAR(255),
                numberOfAyahs INT,
                revelationType VARCHAR(50)
            )
        `);

        // Check if data is already seeded
        const [rows] = await connection.query('SELECT * FROM surahs ORDER BY number ASC') as any[];

        if (rows.length === 0) {
            // Seed data
            for (const surah of surahs) {
                await connection.query(
                    'INSERT IGNORE INTO surahs (number, name, englishName, englishNameTranslation, numberOfAyahs, revelationType) VALUES (?, ?, ?, ?, ?, ?)',
                    [surah.number, surah.name, surah.englishName, surah.englishNameTranslation, surah.numberOfAyahs, surah.revelationType]
                );
            }
            // Fetch newly inserted rows
            const [newRows] = await connection.query('SELECT * FROM surahs ORDER BY number ASC') as any[];
            connection.release();
            return NextResponse.json(newRows);
        }

        connection.release();
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching/seeding database:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
