import React, { useRef } from "react";
import { CapaProposta, PropostaData } from "./CapaProposta";
import { QuemSomosProposta } from "./QuemSomosProposta";
import { ComoFuncionaProposta } from "./ComoFuncionaProposta";
import { ResumoOperacaoProposta } from "./ResumoOperacaoProposta";
import { EstrategiaLanceProposta } from "./EstrategiaLanceProposta";
import { PlanejamentoProposta } from "./PlanejamentoProposta";
import { CronogramaProposta } from "./CronogramaProposta";
import { ProximosPassosProposta } from "./ProximosPassosProposta";

interface PropostaPDFContainerProps {
  data: PropostaData;
}

export const PropostaPDFContainer = React.forwardRef<HTMLDivElement, PropostaPDFContainerProps>(
  ({ data }, ref) => {
    return (
      <div 
        ref={ref}
        style={{
          // Render off-screen
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "794px", // A4 width at 96 DPI
          display: "flex",
          flexDirection: "column",
          gap: "20px", // gap between pages for visual debugging if needed
        }}
      >
        <div id="pdf-page-1"><CapaProposta data={data} /></div>
        <div id="pdf-page-2"><QuemSomosProposta data={data} /></div>
        <div id="pdf-page-3"><ComoFuncionaProposta data={data} /></div>
        <div id="pdf-page-4"><ResumoOperacaoProposta data={data} /></div>
        <div id="pdf-page-5"><EstrategiaLanceProposta data={data} /></div>
        <div id="pdf-page-6"><PlanejamentoProposta data={data} /></div>
        <div id="pdf-page-7"><CronogramaProposta data={data} /></div>
        <div id="pdf-page-8"><ProximosPassosProposta data={data} /></div>
      </div>
    );
  }
);

PropostaPDFContainer.displayName = "PropostaPDFContainer";

/**
 * Converts all computed colors on every element from modern CSS color functions
 * (lab, oklch, oklab, lch) to plain RGB so html2canvas can parse them.
 */
function forceRGBColors(root: HTMLElement) {
  const colorProps = [
    "color",
    "backgroundColor",
    "borderColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "textDecorationColor",
    "boxShadow",
  ] as const;

  const elements = root.querySelectorAll("*");
  const allEls = [root, ...Array.from(elements)] as HTMLElement[];

  for (const el of allEls) {
    if (!el.style) continue;
    const computed = window.getComputedStyle(el);
    for (const prop of colorProps) {
      const val = computed[prop as any] as string;
      if (val && /\b(lab|oklch|oklab|lch)\(/i.test(val)) {
        // Fallback to rgb(0,0,0) to prevent html2canvas crashes if browser natively returns lab
        (el.style as any)[prop] = "rgb(0, 0, 0)";
      }
    }
  }

  // Second pass: use a temporary element to resolve any remaining non-rgb values
  const tempDiv = document.createElement("div");
  tempDiv.style.display = "none";
  document.body.appendChild(tempDiv);

  for (const el of allEls) {
    if (!el.style) continue;
    for (const prop of colorProps) {
      const inlineVal = (el.style as any)[prop] as string;
      if (inlineVal && /\b(lab|oklch|oklab|lch)\(/i.test(inlineVal)) {
        tempDiv.style.color = inlineVal;
        let resolved = window.getComputedStyle(tempDiv).color;
        if (/\b(lab|oklch|oklab|lch)\(/i.test(resolved)) {
           resolved = "rgb(0, 0, 0)";
        }
        (el.style as any)[prop] = resolved;
      }
    }
  }

  document.body.removeChild(tempDiv);
}

export const generateRichPDF = async (
  containerRef: React.RefObject<HTMLDivElement | null>
): Promise<Blob> => {
  if (!containerRef.current) {
    throw new Error("Container ref is not available");
  }

  const html2canvasModule = await import("html2canvas");
  const html2canvas = html2canvasModule.default;
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;

  const pdf = new jsPDF("p", "mm", "a4");
  const a4WidthMm = 210;
  const a4HeightMm = 297;

  const pages = [
    "pdf-page-1", "pdf-page-2", "pdf-page-3", "pdf-page-4",
    "pdf-page-5", "pdf-page-6", "pdf-page-7", "pdf-page-8"
  ];

  for (let i = 0; i < pages.length; i++) {
    const pageId = pages[i];
    const pageElement = containerRef.current.querySelector(`#${pageId}`) as HTMLElement;
    
    if (pageElement) {
      const canvas = await html2canvas(pageElement, {
        // @ts-ignore
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (_doc: Document, clonedEl: HTMLElement) => {
          // Convert all lab/oklch/oklab/lch colors to RGB in the cloned DOM
          forceRGBColors(clonedEl);
          
          try {
            // Extract all CSS rules from the original document's stylesheets
            let safeCssText = "";
            for (let i = 0; i < document.styleSheets.length; i++) {
              const sheet = document.styleSheets[i];
              try {
                const rules = sheet.cssRules || sheet.rules;
                for (let j = 0; j < rules.length; j++) {
                  const rule = rules[j];
                  let text = rule.cssText;
                  if (/(?:oklch|oklab|lab|lch)\b/i.test(text)) {
                    // Remove the entire property that contains lab/oklch to prevent parsing crash. Keep the trailing semicolon or brace.
                    text = text.replace(/[a-zA-Z-]+:\s*[^;}]*(?:oklch|oklab|lab|lch)[^;}]*([;}])/gi, "$1");
                  }
                  safeCssText += text + "\n";
                }
              } catch (e) {
                // Ignore cross-origin stylesheet errors
              }
            }

            // Create a new safe style element
            const safeStyle = _doc.createElement("style");
            safeStyle.innerHTML = safeCssText;
            _doc.head.appendChild(safeStyle);

            // Remove all original link and style tags so html2canvas doesn't parse them
            const links = _doc.querySelectorAll('link[rel="stylesheet"]');
            links.forEach((link) => link.parentNode?.removeChild(link));

            const styles = _doc.querySelectorAll("style");
            styles.forEach((style) => {
              if (style !== safeStyle) {
                style.parentNode?.removeChild(style);
              }
            });
          } catch (e) {
            console.error("Error patching stylesheets for html2canvas:", e);
          }
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      if (i > 0) {
        pdf.addPage();
      }
      
      pdf.addImage(imgData, "JPEG", 0, 0, a4WidthMm, a4HeightMm);
    }
  }

  return pdf.output("blob");
}
