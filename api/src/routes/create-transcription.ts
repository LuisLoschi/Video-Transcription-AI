import { prisma } from '../lib/prisma'
import { FastifyInstance } from "fastify";
import { createReadStream } from 'fs';
import { z } from "zod";
import { openai } from '../lib/openai';

export async function createTranscriptionRoute(app: FastifyInstance) {
    app.post('/videos/:videoId/transcription', async (req) => {
        const paramsSchema = z.object({
            videoId: z.string().uuid() //validação do formato
        })
        
        const { videoId } = paramsSchema.parse(req.params)

        const bodySchema = z.object({
            prompt: z.string(),
        })

        const { prompt } = bodySchema.parse(req.body)

        const video = await prisma.video.findFirstOrThrow({
            where: {
                id: videoId,
            }
        })

        //Transcrição
        const videoPath = video.path
        const audioReadStream = createReadStream(videoPath)

        const response = await openai.audio.transcriptions.create({
            file: audioReadStream,
            model: 'whisper-1',
            language: 'pt',
            response_format: 'json',
            temperature: 0,
            prompt,
        })

        const transcription = response.text

        await prisma.video.update({
            where: {
                id: videoId,
            },
            data: {
                transcription: response.text,
            }
        })

        return { transcription }


        //return response.text

        // return {
        //     videoId,
        //     prompt,
        //     videoPath
        // }

    })
}