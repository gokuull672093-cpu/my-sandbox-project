import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { LegalNotice, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEnquiry } from "@/lib/enquiry.functions";
import { inr } from "@/lib/shop";

const STEPS = [
  { key: "received", label: "Enquiry Received", statuses: ["new", "contact_required"] },
  { key: "contacted", label: "Team Contacted", statuses: ["contacted", "discussion"] },
  { key: "confirmed", label: "Confirmed", statuses: ["confirmed", "ready"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
];

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): { ref?: string } => {
    const out: { ref?: string } = {};
    if (typeof search["ref"] === "string") out.ref = search["ref"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Track Your Enquiry — Upcurv Crackers" },
      {
        name: "description",
        content: "Enter your enquiry ID to see where your Upcurv Crackers enquiry stands.",
      },
      { property: "og:title", content: "Track Your Enquiry — Upcurv Crackers" },
      { property: "og:description", content: "Check the status of your crackers enquiry." },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const initialRef = Route.useSearch().ref;
  const [ref, setRef] = useState(initialRef ?? "");
  const track = useServerFn(trackEnquiry);
  const mutation = useMutation({ mutationFn: (value: string) => track({ data: { ref: value } }) });

  useEffect(() => {
    if (initialRef) mutation.mutate(initialRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRef]);

  const data = mutation.data;
  const currentIndex = data ? STEPS.findIndex((s) => s.statuses.includes(data.status)) : -1;

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-xl px-4 py-8">
        <h1 className="text-3xl font-semibold">Track Enquiry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the enquiry ID we gave you, e.g. UC-26-10482.
        </p>

        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (ref.trim()) mutation.mutate(ref.trim());
          }}
        >
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UC-26-10482" />
          <Button type="submit" disabled={mutation.isPending}>
            Check
          </Button>
        </form>

        {mutation.isPending && (
          <div className="mt-6 space-y-3 rounded-2xl border border-border p-5">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="shimmer h-24 w-full rounded-xl" />
          </div>
        )}

        {mutation.isSuccess && !data && (
          <p className="mt-6 rounded-xl border border-border p-5 text-sm text-muted-foreground">
            No enquiry found with that ID. Please check and try again.
          </p>
        )}

        {data && (
          <div className="mt-6 rounded-2xl border border-border p-5">
            <p className="font-mono text-sm font-semibold">{data.ref}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.name} · {data.city} · {data.item_count} items ·{" "}
              {inr(Number(data.estimated_value))} indicative
            </p>
            <ol className="mt-5 space-y-4">
              {STEPS.map((s, i) => {
                const state =
                  data.status === "not_converted"
                    ? i === 0
                      ? "done"
                      : "todo"
                    : i <= currentIndex
                      ? "done"
                      : "todo";
                return (
                  <li key={s.key} className="flex items-center gap-3 text-sm">
                    <span
                      className={`grid size-6 place-items-center rounded-full text-xs ${
                        state === "done"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground"
                      }`}
                    >
                      {state === "done" ? "✓" : i + 1}
                    </span>
                    <span className={state === "done" ? "font-medium" : "text-muted-foreground"}>
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
            {data.status === "not_converted" && (
              <p className="mt-4 text-sm text-muted-foreground">
                This enquiry was closed. Call us if you&apos;d like to reopen it.
              </p>
            )}
          </div>
        )}

        <div className="mt-6">
          <LegalNotice />
        </div>
      </div>
    </SiteShell>
  );
}
