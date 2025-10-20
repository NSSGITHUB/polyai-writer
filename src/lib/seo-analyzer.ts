export interface SeoScore {
  overall: number; // 0-100
  scores: {
    titleLength: number;
    keywordDensity: number;
    contentLength: number;
    readability: number;
    structure: number;
  };
  suggestions: string[];
  details: {
    titleLength: number;
    wordCount: number;
    keywordCount: number;
    keywordDensity: number;
    paragraphCount: number;
    averageSentenceLength: number;
  };
}

export function analyzeSeo(
  title: string,
  content: string,
  keywords?: string
): SeoScore {
  const suggestions: string[] = [];
  const scores = {
    titleLength: 0,
    keywordDensity: 0,
    contentLength: 0,
    readability: 0,
    structure: 0,
  };

  // 1. 標題長度分析
  const titleLength = title.length;
  if (titleLength >= 50 && titleLength <= 60) {
    scores.titleLength = 100;
  } else if (titleLength >= 40 && titleLength <= 70) {
    scores.titleLength = 80;
  } else if (titleLength >= 30 && titleLength <= 80) {
    scores.titleLength = 60;
  } else {
    scores.titleLength = 40;
    if (titleLength < 30) {
      suggestions.push("標題太短，建議增加到 50-60 字符以提升 SEO 效果");
    } else {
      suggestions.push("標題太長，建議縮短到 50-60 字符以避免被截斷");
    }
  }

  // 2. 內容長度分析
  const wordCount = content.length;
  if (wordCount >= 1500) {
    scores.contentLength = 100;
  } else if (wordCount >= 800) {
    scores.contentLength = 80;
  } else if (wordCount >= 500) {
    scores.contentLength = 60;
  } else {
    scores.contentLength = 40;
    suggestions.push(`內容長度僅 ${wordCount} 字，建議至少 800 字以上以提升 SEO 排名`);
  }

  // 3. 關鍵字密度分析
  let keywordCount = 0;
  let keywordDensity = 0;
  if (keywords) {
    const keywordList = keywords.split(/[,，、\s]+/).filter(k => k.trim());
    const contentLower = content.toLowerCase();
    
    keywordList.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), "gi");
      const matches = contentLower.match(regex);
      if (matches) {
        keywordCount += matches.length;
      }
    });

    keywordDensity = (keywordCount / wordCount) * 100;
    
    if (keywordDensity >= 1 && keywordDensity <= 3) {
      scores.keywordDensity = 100;
    } else if (keywordDensity >= 0.5 && keywordDensity <= 5) {
      scores.keywordDensity = 70;
    } else {
      scores.keywordDensity = 40;
      if (keywordDensity < 0.5) {
        suggestions.push("關鍵字密度過低，建議在內容中自然地增加關鍵字出現次數");
      } else {
        suggestions.push("關鍵字密度過高，可能被視為關鍵字堆砌，建議降低密度");
      }
    }
  } else {
    scores.keywordDensity = 50;
    suggestions.push("未設定關鍵字，建議添加目標關鍵字以優化 SEO");
  }

  // 4. 可讀性分析
  const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim());
  const averageSentenceLength = wordCount / (sentences.length || 1);
  
  if (averageSentenceLength <= 20) {
    scores.readability = 100;
  } else if (averageSentenceLength <= 30) {
    scores.readability = 80;
  } else if (averageSentenceLength <= 40) {
    scores.readability = 60;
  } else {
    scores.readability = 40;
    suggestions.push("平均句子長度較長，建議使用更短的句子以提升可讀性");
  }

  // 5. 段落結構分析
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  const paragraphCount = paragraphs.length;
  
  if (paragraphCount >= 5) {
    scores.structure = 100;
  } else if (paragraphCount >= 3) {
    scores.structure = 70;
  } else {
    scores.structure = 40;
    suggestions.push("段落數量較少，建議增加段落以提升文章結構和可讀性");
  }

  // 檢查是否包含標題關鍵字
  if (keywords) {
    const titleLower = title.toLowerCase();
    const keywordList = keywords.split(/[,，、\s]+/).filter(k => k.trim());
    const hasKeywordInTitle = keywordList.some(k => titleLower.includes(k.toLowerCase()));
    
    if (!hasKeywordInTitle) {
      suggestions.push("建議在標題中包含主要關鍵字");
    }
  }

  // 計算總分
  const overall = Math.round(
    (scores.titleLength +
      scores.keywordDensity +
      scores.contentLength +
      scores.readability +
      scores.structure) / 5
  );

  return {
    overall,
    scores,
    suggestions,
    details: {
      titleLength,
      wordCount,
      keywordCount,
      keywordDensity: Math.round(keywordDensity * 100) / 100,
      paragraphCount,
      averageSentenceLength: Math.round(averageSentenceLength * 10) / 10,
    },
  };
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "優秀";
  if (score >= 60) return "良好";
  if (score >= 40) return "及格";
  return "需改進";
}