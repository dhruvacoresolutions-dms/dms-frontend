import Link from "next/link"
import { FileQuestion, House } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-1 items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileQuestion />
          </EmptyMedia>
          <EmptyTitle className="text-xl">Page not found</EmptyTitle>
          <EmptyDescription>
            The page you’re looking for may have been moved or removed.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/" />}>
            <House className="mr-2 size-4" />
            Return to Home
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
