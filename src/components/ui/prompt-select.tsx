import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { api } from "@/lib/axios";

interface Prompt {
    id: string
    title: string
    description: string
}

interface PromptSelectProps {
    onPromptSelected: (description: string) => void
}

export function PromptSelect(props: PromptSelectProps) {

    const [prompts, setPrompts] = useState<Prompt[] | null>(null)

    //Carrega os prompts do banco de dadoss
    useEffect(() => {
        api.get('/prompts').then(response => {
            //console.log(response.data)
            setPrompts(response.data)
        })
    }, [])

    //Função que encontra o id e retorna o template do prompt
    function handlePromptSelected(promptId: string)  {
        const selectedPrompt = prompts?.find(prompt => prompt.id === promptId)

        if (!selectedPrompt) {
            return
        }

        props.onPromptSelected(selectedPrompt.description)
    }

    return (
        <Select onValueChange={handlePromptSelected}>
            <SelectTrigger>
                <SelectValue placeholder="Selecione um prompt..." />
            </SelectTrigger>
            <SelectContent>
                {prompts?.map(prompt => {
                    return (
                        <SelectItem 
                            key={prompt.id} 
                            value={prompt.id}
                        >
                            {prompt.title}
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
}