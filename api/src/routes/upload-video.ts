import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { fastifyMultipart } from '@fastify/multipart'
import path from "node:path";
import { randomUUID } from "node:crypto";
import fs from "node:fs" 
import { pipeline } from "node:stream" 
import { promisify } from "node:util";

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance) {
    app.register(fastifyMultipart, {
        limits: {
            fileSize: 1048576 
        } 
    })
    
    app.post('/videos', async (request, reply) => {
        const data = await request.file()

        //Caso não envie nenhum arquivo
        if (!data) {
            return reply.status(400).send({ error: 'Missing file input'})
        }

        const extention = path.extname(data.filename) //retorna extensão do arquivo

        if (extention != '.mp3') {
            return reply.status(400).send({ error: 'Invalid input type, please upload a MP3'})
        }

        const fileBaseName          = path.basename(data.fieldname, extention) //retorna nome  do arquivo
        const fileUploadName        = `${fileBaseName}-${randomUUID()}${extention}`  //Construção do nome do arquivo e sua extenção
        const uploadPathDestination = path.resolve(__dirname, '../../tmp', fileUploadName)           //Retorna o caminho do upload dos arquivos

        await pump(data.file, fs.createWriteStream(uploadPathDestination)) //Aguarda o upload do arquivo

        const video = await prisma.video.create({
            data: {
                name: data.filename,
                path: uploadPathDestination,
            }
        })

        return {
            video
        }
    })
}