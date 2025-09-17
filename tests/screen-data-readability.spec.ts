import { test } from '@playwright/test';
import { collectPageTexts } from './helpers/utils/page-text-collector';
import * as fs from 'fs';
import * as path from 'path';
import {
  completeStateSelection,
  completeDisclaimer,
  completeLocationInfo,
  completeHouseholdSize,
  completePrimaryUserInfo,
  completeHouseholdMemberInfo,
  completeExpenses,
  completeAssets,
  completePublicBenefits,
  completeNeeds,
  completeReferralSource,
  completeAdditionalInfo,
  navigateToResults,
} from './helpers/flows/common';
import {
  fleschKincaidGrade,
  fleschKincaidReadingEase,
  daleChallReadabilityScore,
  automatedReadabilityIndex,
  colemanLiauIndex,
  gunningFog,
  smogIndex,
  getPolysyllabicWords,
  getSentenceCount,
  getWordCount,
  getLongestSentence,
  getPassiveVoice
} from './helpers/utils/text-analyzer';

interface ReadabilityMetrics {
  pageName: string;
  textElements: Array<{
    text: string;
    wordCount: number;
    sentenceCount: number;
    longestSentence: string;
    polysyllabicWordCount: number;
    polysyllabicWords: string[];
    passiveVoiceCount: number;
    passiveVoiceSentences: string[];
    scores: {
      fleschReadingEase: number;
      fleschKincaidGrade: number;
      daleChallScore: number;
      automatedReadability: number;
      colemanLiau: number;
      gunningFog: number;
      smog: number;
    }
  }>;
}

test.describe('Screen Text Collection and Readability Analysis', () => {  
  test.setTimeout(180000); 
  test('collect and analyze text readability', async ({ page }) => {        
    const navigationSteps = [
      {
        url: '/',
        name: 'Home Page',
        action: async () => {
          await page.getByRole('button', { name: 'Get Started' }).click();
        }
      },
      {
        url: '/select-state',
        name: 'State Selection',
        action: async () => {
          await completeStateSelection(page, 'North Carolina');
        }
      },
      {
        url: '/nc/step-2',
        name: 'Step 2',
        action: async () => {
          await completeDisclaimer(page);
        }
      },
      {
        url: /\/nc\/.*\/step-3/,
        name: 'Step 3',
        action: async () => {
          await completeLocationInfo(page, '27704', 'Durham County');
        }
      },
      {
        url: /\/nc\/.*\/step-4/,
        name: 'Step 4',
        action: async () => {
          await completeHouseholdSize(page, '2');
        }
      },
      {
        url: /\/nc\/.*\/step-5/,
        name: 'Step 5',
        action: async () => {
            await completePrimaryUserInfo(page, {
                birthMonth: 'March',
                birthYear: '1990',
                hasIncome: true,
                income: {
                    type: 'Wages, salaries, tips',
                    frequency: 'every month',
                    amount: '2200'
                }
            });
        }        
      },
      {
        url: /\/nc\/.*\/step-5/,
        name: 'Step 5',
        action: 
          async () => {
            await completeHouseholdMemberInfo(page, {
              birthMonth: 'March',
              birthYear: '1989',
              relationship: 'Child',
              hasIncome: false  
            });
          }        
      },
      {
        url: /\/nc\/.*\/step-6/,
        name: 'Step 6',
        action: 
          async () => {
            await completeExpenses(page, {
              hasExpenses: true,
              type: 'Rent',
              amount: '2500'
            });
          }        
      },
      {
        url: /\/nc\/.*\/step-7/,
        name: 'Step 7',
        action: 
          async () => {
            await completeAssets(page, '100');
          }        
      },
      {
        url: /\/nc\/.*\/step-8/,
        name: 'Step 8',
        action: async () => {
          await completePublicBenefits(page);
        }
      },
      {
        url: /\/nc\/.*\/step-9/,
        name: 'Step 9',
        action: async () => {
          await completeNeeds(page, [
            'Food or groceries',
            "Concern about your child's",
            'Free or low-cost help with'
          ]);
        }
      },
      {
        url: /\/nc\/.*\/step-10/,
        name: 'Step 10',
        action: async () => {
          await completeReferralSource(page, 'Test / Prospective Partner');
        }
      },
      {
        url: /\/nc\/.*\/step-11/,
        name: 'Step 11',
        action: async () => {
          await completeAdditionalInfo(page);
        }
      },
      {
        url: /\/nc\/.*\/confirm-information/,
        name: 'Step confirm',
        action: async () => {
          await navigateToResults(page);
        }
      },       
      {
        url: /\/nc\/.*\/results\/benefits\/?admin=true/,
        name: 'Benefits',
        action: async () => {          
          await page.waitForLoadState('networkidle');
          await page.waitForLoadState('domcontentloaded');

          try {

            // First collect Long-Term Benefits data
            await page.waitForSelector('.result-program-container', { timeout: 10000 });
            const programCards = await page.$$('.result-program-container');

            // Process each Long-Term Benefits program
            for (let i = 0; i < programCards.length; i++) {
              try {
                await page.waitForTimeout(1000);
                // Re-query the program cards to ensure we have fresh elements
                const currentCards = await page.$$('.result-program-container');
                
                // Check if the current index is still valid
                if (i >= currentCards.length) {
                  console.log(`Program card ${i + 1} no longer exists, skipping`);
                  continue;
                }
                
                const moreInfoButton = await currentCards[i].$('.result-program-more-info-button a');
                if (moreInfoButton) {
                  await moreInfoButton.click();
                  await page.waitForLoadState('networkidle');
                  
                  const programTexts = await collectPageTexts(page);
                  prgMoreInfoscreenTexts[`Long-Term-Benefits-Program-${i + 1}`] = programTexts;
                  
                  await page.goBack();
                  await page.waitForLoadState('networkidle');
                }
              } catch (error) {
                console.error(`Error processing Long-Term Benefits program ${i + 1}:`, error);
                continue;
              }
            }

            // Switch to Near-Term Benefits tab            
            const nearTermTab = page.getByRole('heading', { name: /ADDITIONAL RESOURCES/i }).first();
            //additional types of resources
            await nearTermTab.click();
            await page.waitForLoadState('networkidle');

            // Collect Near-Term Benefits data
            await page.waitForSelector('.need-card-container', { timeout: 100000 });
            const needCards = await page.$$('.need-card-container');

            // Process each Near-Term Benefits program
            for (let i = 0; i < needCards.length; i++) {
              try {
                await page.waitForTimeout(1000);
                // Re-query the need cards to ensure we have fresh elements
                const currentNeedCards = await page.$$('.need-card-container');
                
                // Check if the current index is still valid
                if (i >= currentNeedCards.length) {
                  console.log(`Need card ${i + 1} no longer exists, skipping`);
                  continue;
                }
                
                const moreInfoButton = await currentNeedCards[i].$('.more-info-btn');
                if (moreInfoButton) {
                  await moreInfoButton.click();
                  await page.waitForLoadState('networkidle');
                  
                  const needTexts = await collectPageTexts(page);
                  prgMoreInfoscreenTexts[`Near-Term-Benefits-Program-${i + 1}`] = needTexts;
                  
                  // Close the expanded card by clicking More Info again
                  await moreInfoButton.click();
                  await page.waitForLoadState('networkidle');
                }
              } catch (error) {
                console.error(`Error processing Near-Term Benefits program ${i + 1}:`, error);
                continue;
              }
            }

            // Wait before clicking save results
            await page.waitForTimeout(1000);
            
            // Find and click save results button
            const saveButton = page.getByRole('button', { name: 'save my results' });
            await saveButton.waitFor({ state: 'visible', timeout: 5000 });
            await saveButton.click();
            
            // Wait for final navigation
            await page.waitForLoadState('networkidle');
          } catch (error) {
            console.error('Error in Benefits section:', error);
            throw error;
          }
        }        
      },
    ];

    const screenTexts: { [key: string]: string[] } = {};
    const prgMoreInfoscreenTexts: { [key: string]: string[] } = {};
    const readabilityResults: ReadabilityMetrics[] = [];
    const uniqueTexts = new Set<string>();

    // Helper function to filter texts
    function filterTexts(texts: string[]): string[] {
      return texts.filter(text => {
        // Skip if already seen
        if (uniqueTexts.has(text)) return false;

        // Skip if text is just numbers or contains currency
        if (/^\d+$/.test(text) || text.includes('$')) return false;

        // Skip if text is a date format (both MM/DD/YYYY and MM/YYYY)
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text) || /^\d{2}\/\d{4}$/.test(text)) return false;

        // Skip CSS class names and SVG styling
        if (text.startsWith('.cls-') || text.startsWith('.question-mark-icon')) return false;

        // Skip if text is very short (like single letters or numbers)
        if (text.length < 2) return false;

        // Add to unique set and return true to keep this text
        uniqueTexts.add(text);
        return true;
      });
    }
    
    // Navigate through each step
    for (const step of navigationSteps) {
      // Navigate to the page if it's a direct URL      
      if (typeof step.url === 'string') {
        await page.goto(step.url);
      }
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');

      const texts = await collectPageTexts(page);      
      // Filter for unique, non-numeric texts
      const filteredTexts = filterTexts(texts);
      screenTexts[step.name] = filteredTexts;

      // Analyze readability for each text element individually
      const metrics: ReadabilityMetrics = {
        pageName: step.name,
        textElements: filteredTexts.map(text => ({
          text,
          wordCount: getWordCount(text),
          sentenceCount: getSentenceCount(text),
          longestSentence: getLongestSentence(text),
          polysyllabicWordCount: getPolysyllabicWords(text).length,
          polysyllabicWords: getPolysyllabicWords(text),
          passiveVoiceCount: getPassiveVoice(text).length,
          passiveVoiceSentences: getPassiveVoice(text),
          scores: {
            fleschReadingEase: fleschKincaidReadingEase(text),
            fleschKincaidGrade: fleschKincaidGrade(text),
            daleChallScore: daleChallReadabilityScore(text),
            automatedReadability: automatedReadabilityIndex(text),
            colemanLiau: colemanLiauIndex(text),
            gunningFog: gunningFog(text),
            smog: smogIndex(text)
          }
        }))
      };

      readabilityResults.push(metrics);
      // Perform the navigation action for this step
      try {
        await step.action();        
      } catch (error) {        
        throw error;
      }

     await page.waitForLoadState('networkidle');
    }

    // Generate reports
    const outputDir = './test-results/readability';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate timestamp for filenames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Generate CSV report
    const csvRows = [      
      [
        'Page',
        'Text Content',
        'Word Count',
        'Sentence Count',
        'Polysyllabic Words',
        'Passive Voice Count',
        'Flesch Reading Ease',
        'Flesch-Kincaid Grade',
        'Dale-Chall Score',
        'Automated Readability',
        'Coleman-Liau',
        'Gunning Fog',
        'SMOG'
      ].join(','),      
      ...readabilityResults.flatMap(result => 
        result.textElements.map(element => 
          [
            result.pageName,
            `"${element.text.replace(/"/g, '""')}"`,
            element.wordCount,
            element.sentenceCount,
            element.polysyllabicWordCount,
            element.passiveVoiceCount,
            element.scores.fleschReadingEase.toFixed(1),
            element.scores.fleschKincaidGrade.toFixed(1),
            element.scores.daleChallScore.toFixed(1),
            element.scores.automatedReadability.toFixed(1),
            element.scores.colemanLiau.toFixed(1),
            element.scores.gunningFog.toFixed(1),
            element.scores.smog.toFixed(1)
          ].join(',')
        )
      )
    ].join('\n');

    const getReadingLevel = (fleschScore: number): string => {
      if (fleschScore >= 90) return 'Very Easy';
      if (fleschScore >= 80) return 'Easy';
      if (fleschScore >= 70) return 'Fairly Easy';
      if (fleschScore >= 60) return 'Plain';
      if (fleschScore >= 50) return 'Fairly Hard';
      if (fleschScore >= 30) return 'Hard';
      return 'Very Hard - Graduate';
    };

    // Generate detailed JSON report with enhanced metrics
    const detailedReport = {
      summary: {
        totalPages: readabilityResults.length,
        overallMetrics: {
          averageFleschScore: average(readabilityResults.flatMap(r => r.textElements.map(e => e.scores.fleschReadingEase))),
          averageGradeLevel: average(readabilityResults.flatMap(r => r.textElements.map(e => e.scores.fleschKincaidGrade))),
          averageWordsPerSentence: average(readabilityResults.flatMap(r => r.textElements.map(e => e.wordCount / (e.sentenceCount || 1)))),
          totalWords: readabilityResults.reduce((sum, r) => sum + r.textElements.reduce((s, e) => s + e.wordCount, 0), 0),
          totalSentences: readabilityResults.reduce((sum, r) => sum + r.textElements.reduce((s, e) => s + e.sentenceCount, 0), 0),
          totalPolysyllabicWords: readabilityResults.reduce((sum, r) => sum + r.textElements.reduce((s, e) => s + e.polysyllabicWordCount, 0), 0),
          averageSyllablesPerWord: readabilityResults.reduce((sum, r) => sum + r.textElements.reduce((s, e) => s + e.polysyllabicWordCount, 0), 0) / 
                                   readabilityResults.reduce((sum, r) => sum + r.textElements.reduce((s, e) => s + e.wordCount, 0), 0)
        }
      },
      pageDetails: readabilityResults.map(result => ({
        page: result.pageName,
        summary: {
          readingLevel: getReadingLevel(
            average(result.textElements.map(e => e.scores.fleschReadingEase))
          ),
          readabilityAssessment: `${
            average(result.textElements.map(e => e.scores.fleschReadingEase)) < 60 ? 'Needs Simplification' : 'Acceptable'
          }`,
        },
        metrics: {
          basic: {
            sentences: result.textElements.reduce((sum, e) => sum + e.sentenceCount, 0),
            words: result.textElements.reduce((sum, e) => sum + e.wordCount, 0),
            avgWordsPerSentence: (
              result.textElements.reduce((sum, e) => sum + e.wordCount, 0) /
              (result.textElements.reduce((sum, e) => sum + e.sentenceCount, 0) || 1)
            ).toFixed(1),
            avgSyllablesPerWord: (
              result.textElements.reduce((sum, e) => sum + e.polysyllabicWordCount, 0) /
              (result.textElements.reduce((sum, e) => sum + e.wordCount, 0) || 1)
            ).toFixed(1)
          },
          scores: {
            fleschReadingEase: {
              score: average(result.textElements.map(e => e.scores.fleschReadingEase)).toFixed(1),
              interpretation: getReadingLevel(average(result.textElements.map(e => e.scores.fleschReadingEase)))
            },
            fleschKincaidGrade: {
              score: average(result.textElements.map(e => e.scores.fleschKincaidGrade)).toFixed(1),
              interpretation: `Grade ${Math.round(average(result.textElements.map(e => e.scores.fleschKincaidGrade)))}`
            },
            otherMetrics: {
              daleChall: average(result.textElements.map(e => e.scores.daleChallScore)).toFixed(1),
              automatedReadability: average(result.textElements.map(e => e.scores.automatedReadability)).toFixed(1),
              colemanLiau: average(result.textElements.map(e => e.scores.colemanLiau)).toFixed(1),
              gunningFog: average(result.textElements.map(e => e.scores.gunningFog)).toFixed(1),
              smog: average(result.textElements.map(e => e.scores.smog)).toFixed(1)
            }
          },
          complexity: {
            polysyllabicWordCount: result.textElements.reduce((sum, e) => sum + e.polysyllabicWordCount, 0),
            passiveVoiceCount: result.textElements.reduce((sum, e) => sum + e.passiveVoiceCount, 0),
            complexityIndicators: {
              longSentence: result.textElements
                .map(e => e.longestSentence)
                .sort((a, b) => (b.length - a.length))[0] || '',
              polysyllabicWords: result.textElements
                .flatMap(e => e.polysyllabicWords)
                .slice(0, 5),
              passiveVoice: result.textElements
                .flatMap(e => e.passiveVoiceSentences)
                .slice(0, 3) 
            }
          }
        }
      }))
    };

    fs.writeFileSync(
      path.join(outputDir, `readability-metrics-${timestamp}.csv`),
      csvRows
    );
    fs.writeFileSync(
      path.join(outputDir, `detailed-readability-${timestamp}.json`),
      JSON.stringify(detailedReport, null, 2)
    );

    // Helper function to create table-formatted text
    function formatTableData(data: any[], columns: string[]): string {
      // Calculate column widths
      const columnWidths = columns.map(col => {
        const values = data.map(row => String(row[col] || ''));
        const headerLength = col.length;
        const maxLength = Math.max(headerLength, ...values.map(v => v.length));
        return maxLength + 2; // Add padding
      });

      // Create header row
      const header = columns.map((col, i) => col.padEnd(columnWidths[i])).join('│');
      const separator = columns.map((_, i) => '─'.repeat(columnWidths[i])).join('┼');

      // Create data rows
      const rows = data.map(row =>
        columns.map((col, i) => String(row[col] || '').padEnd(columnWidths[i])).join('│')
      );

      // Combine all parts
      return `┌${columns.map((_, i) => '─'.repeat(columnWidths[i])).join('┬')}┐\n` +
             `│${header}│\n` +
             `├${separator}┤\n` +
             `${rows.map(row => `│${row}│`).join('\n')}\n` +
             `└${columns.map((_, i) => '─'.repeat(columnWidths[i])).join('┴')}┘`;
    }

    // Program Details Readability Analysis
    console.log('\nProgram Details Readability Analysis:');
    const programDetails = Object.entries(prgMoreInfoscreenTexts).flatMap(([programId, texts]) => {
      const filteredTexts = filterTexts(texts);
      
      return {
        pageName: programId,
        textElements: filteredTexts.map(text => ({
          text,
          wordCount: getWordCount(text),
          sentenceCount: getSentenceCount(text),
          longestSentence: getLongestSentence(text),
          polysyllabicWordCount: getPolysyllabicWords(text).length,
          polysyllabicWords: getPolysyllabicWords(text),
          passiveVoiceCount: getPassiveVoice(text).length,
          passiveVoiceSentences: getPassiveVoice(text),
          scores: {
            fleschReadingEase: fleschKincaidReadingEase(text),
            fleschKincaidGrade: fleschKincaidGrade(text),
            daleChallScore: daleChallReadabilityScore(text),
            automatedReadability: automatedReadabilityIndex(text),
            colemanLiau: colemanLiauIndex(text),
            gunningFog: gunningFog(text),
            smog: smogIndex(text)
          }
        }))
      };
    });

    // Generate table-formatted text files
    const readabilityTable = formatTableData(
      readabilityResults.flatMap(r => 
        r.textElements.map(element => ({
          Page: r.pageName,
          Text: element.text.length > 60 
            ? element.text.substring(0, 57) + '...' 
            : element.text.replace(/\n/g, ' ').trim(),
          Level: getReadingLevel(element.scores.fleschReadingEase),
          'Flesch': Number(element.scores.fleschReadingEase.toFixed(1)),
          'Grade': `${element.scores.fleschKincaidGrade.toFixed(1)}`,
          'Words': Number((element.wordCount / element.sentenceCount || 0).toFixed(1)),
          'Complex': element.polysyllabicWordCount || 0,
          'Passive': element.passiveVoiceCount || 0
        }))
      ),
      ['Page', 'Text', 'Level', 'Flesch', 'Grade', 'Words', 'Complex', 'Passive']
    );

    const programDetailsTable = formatTableData(
      programDetails.flatMap(r => 
        r.textElements.map(element => ({
          Program: r.pageName,
          Text: element.text.length > 60 
            ? element.text.substring(0, 57) + '...' 
            : element.text.replace(/\n/g, ' ').trim(),
          Level: getReadingLevel(element.scores.fleschReadingEase),
          'Text Score': Number(element.scores.fleschReadingEase.toFixed(1)),
          'Grade': `${element.scores.fleschKincaidGrade.toFixed(1)}`,
          'Words': Number((element.wordCount / element.sentenceCount || 0).toFixed(1)),
          'Complex': element.polysyllabicWordCount || 0,
          'Passive': element.passiveVoiceCount || 0
        }))
      ),
      ['Program', 'Text', 'Level', 'Text Score', 'Grade', 'Words', 'Complex', 'Passive']
    );

    // Save formatted tables to text files
    fs.writeFileSync(
      path.join(outputDir, `readability-table-${timestamp}.txt`),
      readabilityTable
    );

    fs.writeFileSync(
      path.join(outputDir, `program-details-table-${timestamp}.txt`),
      programDetailsTable
    );

    // Console output for immediate feedback
    console.log('\nReadability Analysis Summary:');
    console.table(readabilityResults.flatMap(r => 
      r.textElements.map(element => ({
        Page: r.pageName,
        Text: element.text.length > 60 
          ? element.text.substring(0, 57) + '...' 
          : element.text.replace(/\n/g, ' ').trim(),
        Level: getReadingLevel(element.scores.fleschReadingEase),
        'Flesch': Number(element.scores.fleschReadingEase.toFixed(1)),
        'Grade': `${element.scores.fleschKincaidGrade.toFixed(1)}`,
        'Words': Number((element.wordCount / element.sentenceCount || 0).toFixed(1)),
        'Complex': element.polysyllabicWordCount || 0,
        'Passive': element.passiveVoiceCount || 0
      }))
    ),
    ['Page', 'Text', 'Level', 'Flesch', 'Grade', 'Words', 'Complex', 'Passive']);

    // Program Details Readability Analysis
    console.log('\nProgram Details Readability Analysis:');
    console.table(
      programDetails.flatMap(r => 
        r.textElements.map(element => ({
          Program: r.pageName,          
          Text: element.text.length > 60 
            ? element.text.substring(0, 57) + '...' 
            : element.text.replace(/\n/g, ' ').trim(),
          Level: getReadingLevel(element.scores.fleschReadingEase),
          'Text Score': Number(element.scores.fleschReadingEase.toFixed(1)),
          'Grade': `${element.scores.fleschKincaidGrade.toFixed(1)}`,
          'Words': Number((element.wordCount / element.sentenceCount || 0).toFixed(1)),
          'Complex': element.polysyllabicWordCount || 0,
          'Passive': element.passiveVoiceCount || 0
        }))
      ),      
      ['Program', 'Text', 'Level', 'Text Score', 'Grade', 'Words', 'Complex', 'Passive']
    );

    // Add overall summary
    const overall = {
      averageFleschScore: average(readabilityResults.flatMap(r => 
        r.textElements.map(e => e.scores.fleschReadingEase)
      )),
      averageGradeLevel: average(readabilityResults.flatMap(r => 
        r.textElements.map(e => e.scores.fleschKincaidGrade)
      )),
      averageWordsPerSentence: average(readabilityResults.flatMap(r => 
        r.textElements.map(e => e.wordCount / (e.sentenceCount || 1))
      )),
      totalComplexWords: readabilityResults.reduce((sum, r) => 
        sum + r.textElements.reduce((s, e) => s + e.polysyllabicWordCount, 0), 0
      ),
      totalPassiveVoice: readabilityResults.reduce((sum, r) => 
        sum + r.textElements.reduce((s, e) => s + e.passiveVoiceCount, 0), 0
      )
    };

    console.log('\nOverall Content Metrics:');
    console.table({
      'Average Reading Level': getReadingLevel(overall.averageFleschScore),
      'Average Grade Level': `Grade ${overall.averageGradeLevel.toFixed(1)}`,
      'Average Words/Sentence': overall.averageWordsPerSentence.toFixed(1),
      'Total Complex Words': overall.totalComplexWords,
      'Total Passive Voice': overall.totalPassiveVoice
    });

    // Add overall summary
    const overallProgram = {
      averageFleschScore: average(programDetails.flatMap(r => 
        r.textElements.map(e => e.scores.fleschReadingEase)
      )),
      averageGradeLevel: average(programDetails.flatMap(r => 
        r.textElements.map(e => e.scores.fleschKincaidGrade)
      )),
      averageWordsPerSentence: average(programDetails.flatMap(r => 
        r.textElements.map(e => e.wordCount / (e.sentenceCount || 1))
      )),
      totalComplexWords: programDetails.reduce((sum, r) => 
        sum + r.textElements.reduce((s, e) => s + e.polysyllabicWordCount, 0), 0
      ),
      totalPassiveVoice: programDetails.reduce((sum, r) => 
        sum + r.textElements.reduce((s, e) => s + e.passiveVoiceCount, 0), 0
      )
    };

    console.log('\nOverall Program Content Metrics:');
    console.table({
      'Average Reading Level': getReadingLevel(overallProgram.averageFleschScore),
      'Average Grade Level': `Grade ${overallProgram.averageGradeLevel.toFixed(1)}`,
      'Average Words/Sentence': overallProgram.averageWordsPerSentence.toFixed(1),
      'Total Complex Words': overallProgram.totalComplexWords,
      'Total Passive Voice': overallProgram.totalPassiveVoice
    });
    // Generate detailed JSON report for program details
    const programDetailedReport = {
      summary: {
        totalPrograms: programDetails.length,
        overallMetrics: {
          averageFleschScore: average(programDetails.flatMap(r => 
            r.textElements.map(e => e.scores.fleschReadingEase)
          )),
          averageGradeLevel: average(programDetails.flatMap(r => 
            r.textElements.map(e => e.scores.fleschKincaidGrade)
          )),
          averageWordsPerSentence: average(programDetails.flatMap(r => 
            r.textElements.map(e => e.wordCount / (e.sentenceCount || 1))
          )),
          totalWords: programDetails.reduce((sum, r) => 
            sum + r.textElements.reduce((s, e) => s + e.wordCount, 0), 0
          ),
          totalSentences: programDetails.reduce((sum, r) => 
            sum + r.textElements.reduce((s, e) => s + e.sentenceCount, 0), 0
          ),
          totalPolysyllabicWords: programDetails.reduce((sum, r) => 
            sum + r.textElements.reduce((s, e) => s + e.polysyllabicWordCount, 0), 0
          )
        }
      },
      programPages: programDetails.map(result => ({
        program: result.pageName,
        summary: {
          readingLevel: getReadingLevel(
            average(result.textElements.map(e => e.scores.fleschReadingEase))
          ),
          readabilityAssessment: `${
            average(result.textElements.map(e => e.scores.fleschReadingEase)) < 60 
            ? 'Needs Simplification' 
            : 'Acceptable'
          }`
        },
        metrics: {
          basic: {
            totalTexts: result.textElements.length,
            sentences: result.textElements.reduce((sum, e) => sum + e.sentenceCount, 0),
            words: result.textElements.reduce((sum, e) => sum + e.wordCount, 0),
            avgWordsPerSentence: (
              result.textElements.reduce((sum, e) => sum + e.wordCount, 0) /
              (result.textElements.reduce((sum, e) => sum + e.sentenceCount, 0) || 1)
            ).toFixed(1),
            avgSyllablesPerWord: (
              result.textElements.reduce((sum, e) => sum + e.polysyllabicWordCount, 0) /
              (result.textElements.reduce((sum, e) => sum + e.wordCount, 0) || 1)
            ).toFixed(1)
          },
          textElements: result.textElements.map(element => ({
            text: element.text,
            wordCount: element.wordCount,
            sentenceCount: element.sentenceCount,
            polysyllabicWordCount: element.polysyllabicWordCount,
            passiveVoiceCount: element.passiveVoiceCount,
            scores: {
              fleschReadingEase: element.scores.fleschReadingEase.toFixed(1),
              fleschKincaidGrade: element.scores.fleschKincaidGrade.toFixed(1),
              readingLevel: getReadingLevel(element.scores.fleschReadingEase),
              otherMetrics: {
                daleChall: element.scores.daleChallScore.toFixed(1),
                automatedReadability: element.scores.automatedReadability.toFixed(1),
                colemanLiau: element.scores.colemanLiau.toFixed(1),
                gunningFog: element.scores.gunningFog.toFixed(1),
                smog: element.scores.smog.toFixed(1)
              }
            },
            complexityIndicators: {
              longestSentence: element.longestSentence,
              polysyllabicWords: element.polysyllabicWords,
              passiveVoiceSentences: element.passiveVoiceSentences
            }
          }))
        }
      }))
    };

    // Generate CSV report
    const programcsvRows = [      
      [
        'Page',
        'Text Content',
        'Word Count',
        'Sentence Count',
        'Polysyllabic Words',
        'Passive Voice Count',
        'Flesch Reading Ease',
        'Flesch-Kincaid Grade',
        'Dale-Chall Score',
        'Automated Readability',
        'Coleman-Liau',
        'Gunning Fog',
        'SMOG'
      ].join(','),      
      ...programDetails.flatMap(result => 
        result.textElements.map(element => 
          [
            result.pageName,
            `"${element.text.replace(/"/g, '""')}"`,
            element.wordCount,
            element.sentenceCount,
            element.polysyllabicWordCount,
            element.passiveVoiceCount,
            element.scores.fleschReadingEase.toFixed(1),
            element.scores.fleschKincaidGrade.toFixed(1),
            element.scores.daleChallScore.toFixed(1),
            element.scores.automatedReadability.toFixed(1),
            element.scores.colemanLiau.toFixed(1),
            element.scores.gunningFog.toFixed(1),
            element.scores.smog.toFixed(1)
          ].join(',')
        )
      )
    ].join('\n');

    // Save program details report
    fs.writeFileSync(
      path.join(outputDir, `program-details-readability-${timestamp}.csv`),
      programcsvRows
    );
    fs.writeFileSync(
      path.join(outputDir, `program-details-readability-${timestamp}.json`),
      JSON.stringify(programDetailedReport, null, 2)
    );
  });
});
  

// Helper function
function average(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}
