import NextLink from "next/link";
import { Button, Flex, Heading, Text } from "@radix-ui/themes";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Flex direction="column" align="start" gap="3" py="8">
      <Text size="2" color="gray">
        This stop isn&apos;t on the line
      </Text>
      <Heading as="h1" size="8">
        Page not found
      </Heading>
      <Text as="p" size="3" className="measure" style={{ margin: 0 }}>
        The page may have moved or the link might be wrong. Try the plan or the creator list instead.
      </Text>
      <Flex gap="3" mt="2" wrap="wrap">
        <Button asChild size="3">
          <NextLink href="/">Go to the plan</NextLink>
        </Button>
        <Button asChild size="3" variant="soft">
          <NextLink href="/creators">See the creators</NextLink>
        </Button>
      </Flex>
    </Flex>
  );
}
