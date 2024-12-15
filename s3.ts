import * as dotenv from "dotenv";
import { S3Client, GetObjectCommand, PutObjectCommand, GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { createWriteStream } from "fs";

dotenv.config();


const s3_client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY_ID || "",
    }
});

const streamToString = (stream: Readable): Promise<string> => {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
};

// Function to upload a file to S3
const updateFile = async (key: string, content: string): Promise<void> => {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
            Body: content,
        });
        await s3_client.send(command);
        console.log(`File uploaded successfully to ${process.env.S3_BUCKET_NAME}/${key}`);
    } catch (error) {
        console.error("Error uploading file:", error);
    }
};

// Function to fetch a file's content as a string
const fetchFile = async (key: string): Promise<string | null> => {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        });

        const response: GetObjectCommandOutput = await s3_client.send(command);

        if (response.Body instanceof Readable) {
            const data = await streamToString(response.Body);
            console.log("File content:", data);
            return data;
        } else {
            console.error("Error: Response body is not a readable stream");
            return null;
        }
    } catch (error) {
        console.error("Error fetching file content:", error);
        return null;
    }
};

export { updateFile, fetchFile };