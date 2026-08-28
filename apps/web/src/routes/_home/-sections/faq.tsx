import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { m } from "motion/react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@reactive-resume/ui/components/accordion";

type FAQItemData = {
	question: string;
	answer: React.ReactNode;
};

const getFaqItems = (): FAQItemData[] => [
	{
		question: t`What can I add to my career base?`,
		answer: t`Projects, launches, hackathons, awards, feedback, metrics, lessons, links, and any other evidence that helps explain what you have accomplished.`,
	},
	{
		question: t`How do connected tools help?`,
		answer: t`Connections bring useful work context into one searchable place, so you spend less time reconstructing your history from scattered products and documents.`,
	},
	{
		question: t`What can I ask my career knowledge base?`,
		answer: t`Ask for your strongest leadership example, projects using a certain skill, measurable outcomes, interview stories, or evidence that matches a role.`,
	},
	{
		question: t`How does resume tailoring work?`,
		answer: t`Share a job description and cloudcoffee selects the most relevant evidence from your career base, then helps shape it into a focused resume you can refine.`,
	},
	{
		question: t`Can I keep more than one resume?`,
		answer: t`Yes. Your career base stays constant while each resume can emphasize a different role, industry, seniority level, or opportunity.`,
	},
	{
		question: t`Can I export and share the result?`,
		answer: t`Yes. Refine the final resume, export it as a polished PDF, or share it through a public link when you are ready.`,
	},
];

export function Faq() {
	const faqItems = getFaqItems();

	return (
		<section
			id="frequently-asked-questions"
			className="grid gap-12 bg-[#f7f3e9] px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[0.75fr_1.25fr]"
		>
			<m.div
				initial={{ opacity: 0, x: -20 }}
				whileInView={{ opacity: 1, x: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.45 }}
			>
				<p className="font-bold font-mono text-[#5f6c71] text-xs uppercase tracking-[0.2em]">02 / Ask clearly</p>
				<h2 className="mt-5 max-w-md font-bold text-4xl leading-[0.98] tracking-[-0.055em] md:text-6xl">
					<Trans>Career questions, answered.</Trans>
				</h2>
			</m.div>

			<m.div
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.45, delay: 0.08 }}
				className="w-full will-change-[transform,opacity]"
			>
				<Accordion multiple>
					{faqItems.map((item, index) => (
						<FAQItemComponent key={item.question} item={item} index={index} />
					))}
				</Accordion>
			</m.div>
		</section>
	);
}

type FAQItemComponentProps = {
	item: FAQItemData;
	index: number;
};

function FAQItemComponent({ item, index }: FAQItemComponentProps) {
	return (
		<m.div
			className="will-change-[transform,opacity]"
			initial={{ opacity: 0, y: 10 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true }}
			transition={{ duration: 0.24, delay: Math.min(0.16, index * 0.03) }}
		>
			<AccordionItem value={item.question} className="group border-[#c9c0ae] border-t last:border-b">
				<AccordionTrigger className="rounded-none py-6 font-bold text-base hover:text-[#f1530a] hover:no-underline">
					{item.question}
				</AccordionTrigger>
				<AccordionContent className="max-w-2xl pb-6 text-[#555c5f] leading-relaxed">{item.answer}</AccordionContent>
			</AccordionItem>
		</m.div>
	);
}
