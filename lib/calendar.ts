export function openGoogleCalendarDraft(input:{
  orderFor:string;
  mode:string;
  total:number;
}) {
  const date=input.orderFor.replaceAll("-","");
  const title=input.mode==="weekend"
    ? "Hajj Terminal - Review Thu + Fri Weekend Order"
    : "Hajj Terminal - Review Inventory Order";
  const details=
    `Hajj Terminal inventory order review. Planned total: ${input.total} pcs. `+
    `Open the Hajj Terminal Inventory app for item-level quantities.`;

  const url=new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action","TEMPLATE");
  url.searchParams.set("text",title);
  url.searchParams.set("dates",`${date}T090000/${date}T093000`);
  url.searchParams.set("ctz","Asia/Riyadh");
  url.searchParams.set("details",details);
  window.open(url.toString(),"_blank","noopener,noreferrer");
}