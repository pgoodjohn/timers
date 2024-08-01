import React from "react";

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"

interface NewTimerFormProps {
    timer?: any;
    onSubmit: any;
}

const formSchema = z.object({
    activity: z.string().min(0).max(50),
    area: z.string().min(0).max(50),
  })

const NewTimerForm: React.FC<NewTimerFormProps> = ({ timer, onSubmit }) => {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
          activity: "",
          area: "",
        },
      })

    return (
        <>
        {timer === null &&
        <div className="flex">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex">
            <div className="flex flex-col">
              <FormField
                control={form.control}
                name="activity"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Activity" {...field} className="" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Area" {...field} className="" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="m-auto">
              <Button type="submit" className="mx-8">Start Timer</Button>
            </div>
          </form>
        </Form>
      </div>
        }
        </>
    )
}

export default NewTimerForm