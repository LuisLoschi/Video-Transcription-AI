import { FileVideo, Upload } from "lucide-react";
import { Separator } from "@radix-ui/react-separator";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from '@ffmpeg/util'
import { api } from '@/lib/axios'

type Status = 'waiting' | 'converting' | 'uploading' | 'generating' | 'success' 

const statusMessages = {
    converting: 'Convertendo...',
    generating: 'Transcrevendo...',
    uploading: 'Carregando...',
    success: 'Sucesso!'
}

interface VideoInputFormProps {
    onVideoUploaded: (id: string) => void
}

export function VideoInputForm(props: VideoInputFormProps) {
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [status, setStatus] = useState<Status>('waiting') //Muda estado do botão ao carregar video


    const promptInputRef = useRef<HTMLTextAreaElement>(null)  //Possibilita acessar a DOM do elemento diretamente

    function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
        const { files } = event.currentTarget

        if (!files) {
            return
        }

        const selectedFile = files[0]

        setVideoFile(selectedFile)
    }

    //Converte video em Audio
    async function convertVideoToAudio(video: File) {
        console.log('convert started')

        const ffmpeg = await getFFmpeg()

        //coloca um arquivo dentro do ffmpeg
        await ffmpeg.writeFile('input.mp4', await fetchFile(video))

        // ffmpeg.on('log', log => {
        //     console.log(log)
        // })

        ffmpeg.on('progress', progress => {
            console.log('convert progress: ' + Math.round(progress.progress * 100))
        })

        //executar ffmpeg
        await ffmpeg.exec([
            '-i',
            'input.mp4',
            '-map',
            '0:a',
            '-b:a',
            '20k',
            '-acodec',
            'libmp3lame',
            'output.mp3',
        ])

        const data = await ffmpeg.readFile('output.mp3')

        const audioFileBlob = new Blob([data], { type: 'audio/mpeg'})
        const audioFile = new File([audioFileBlob], 'audio.mp3', {
            type: 'audio/mpeg',
        })

        console.log('convert finished')

        return audioFile
    }
    //================================================================

    //Função será chamada ao fazer o upload do video
    async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const prompt = promptInputRef.current?.value //acessa o value do textArea

        if (!videoFile) {
            return
        }

        setStatus('converting')

        //converter video em audio
        //WebAssembly: roda linguagens de programação dentro do navegador web
        const audioFile = await convertVideoToAudio(videoFile)
        console.log(audioFile, prompt)

        //Fazer upload do arquivo integrando front com back-end
        const data = new FormData()
        data.append('file', audioFile)

        setStatus('uploading')

        //Retorna os dados do video
        const response = await api.post('/videos', data)
        console.log(response.data)

        //Retorna id do video
        const videoId = response.data.video.id

        setStatus('generating')

        //Gerar transcrição do video
        await api.post(`/videos/${videoId}/transcription`, {
            prompt,
        })

        setStatus('success')

        //Video terminou de ser carregado
        props.onVideoUploaded(videoId)

        //console.log('finalizaou!')
    }
    //===============================================================

    //Carrega somente se o video mudar
    const previewURL = useMemo(() => {
        if (!videoFile) {
            return null
        }

        return URL.createObjectURL(videoFile)
    }, [videoFile])
    //======================

    return(
        <form className="space-y-6" onSubmit={handleUploadVideo}>
            <label 
                htmlFor="video" 
                className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
            >
                {/* Aparecer imagem ao fazer upload do video*/}
                {previewURL ? (
                    <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />
                ) : (
                    <>
                        <FileVideo className="w-4 h-4"/>
                        Selecione um video
                    </>
                )}
                {/* ====================================== */}
            </label>

            <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelected}/>

            <Separator />

            <div className="space-y-2">
                <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
                <Textarea 
                    ref={promptInputRef}
                    disabled={status != 'waiting'}
                    id="transcription_prompt" 
                    className="h-20 leading-relaxed"
                    placeholder="Inclua palavras-chave mencionadas no video separadas por virgula ( , )"
                />
            </div>

            <Button 
                data-success={status === 'success'}
                disabled={status != 'waiting'} 
                type="submit" 
                className="w-full data-[success=true]:bg-emerald-500"
            >
                {status === 'waiting' ? (
                    <>
                        Carregar video
                        <Upload className="w-4 h-4 ml-2"/>
                    </>
                ) : statusMessages[status]} 
            </Button>
        </form>
    )
}