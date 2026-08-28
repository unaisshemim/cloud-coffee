import { t } from "@lingui/core/macro";
import { useHotkey } from "@tanstack/react-hotkeys";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "@reactive-resume/ui/components/toast";
import { LoadingScreen } from "@/components/layout/loading-screen";
import { useResumeData } from "@/features/resume/builder/draft";
import { ResumePreview } from "@/features/resume/preview/preview";
import {
  DEFAULT_PDF_PAGE_SIZE,
  getResumePreviewPageCount,
} from "@/features/resume/preview/preview.shared.utils";
import { getBuilderPreviewPageScale } from "./page-layout";
import { PageNavigator } from "./page-navigator";

export function PreviewPage() {
  const resumeData = useResumeData();
  const estimatedPageCount = getResumePreviewPageCount(resumeData);
  const [totalPages, setTotalPages] = useState(estimatedPageCount);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageScale, setPageScale] = useState(0.75);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateScale = ({ width }: DOMRectReadOnly) => {
      setPageScale(
        getBuilderPreviewPageScale(width, DEFAULT_PDF_PAGE_SIZE.width),
      );
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) updateScale(entry.contentRect);
    });

    observer.observe(viewport);
    updateScale(viewport.getBoundingClientRect());
    return () => observer.disconnect();
  }, []);

  useHotkey("Mod+S", () => {
    toast.add({
      type: "info",
      description: t`Your changes are saved automatically.`,
      id: "auto-save",
    });
  });

  return (
    <Suspense fallback={<LoadingScreen />}>
      <div
        ref={viewportRef}
        className="absolute inset-0 overflow-hidden bg-[#f7f3ef]"
      >
        <div className="absolute top-5 right-5 z-20">
          <PageNavigator
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        <div className="flex h-full items-start justify-center overflow-auto px-6 pt-5 pb-8">
          <ResumePreview
            pageLayout="vertical"
            pageScale={pageScale}
            visiblePage={currentPage}
            pageClassName="rounded-md shadow-sm"
            onPageCountChange={setTotalPages}
          />
        </div>
      </div>
    </Suspense>
  );
}
