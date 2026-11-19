import { getCreators } from "@/lib/data";
import { Note, PageHeader } from "@/components/ui";
import BadgeGenerator from "./BadgeGenerator";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fork badge" };

export default async function Badge() {
  const { creators } = await getCreators();
  const eligible = creators
    .filter((c) => c.group !== "comparison")
    .map((c) => ({ slug: c.slug, name: c.name, referralCode: c.referralCode }));

  return (
    <>
      <PageHeader title="Fork badge">
        The app a creator builds in their video stays online after the video is done. A small button in its footer lets
        anyone who finds it deploy their own copy. The link carries the creator&apos;s referral code. It works like
        Lovable&apos;s &quot;Edit with Lovable&quot; badge.
      </PageHeader>
      <BadgeGenerator creators={eligible} />
      <Note mt="4">
        The badge is optional and easy to take off. Its link has its own tag. That keeps badge deploys separate from
        deploys that come from the video description.
      </Note>
    </>
  );
}
