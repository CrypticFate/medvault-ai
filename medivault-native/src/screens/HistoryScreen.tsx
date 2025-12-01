/**
 * MediVault AI - History Screen
 * List of all scanned medical documents and lab test results
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Search,
  FileText,
  Pill,
  FlaskConical,
  Activity,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Sparkles,
  Eye,
} from 'lucide-react-native';

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../theme';
import { EmptyState } from '../components/common';
import { useRecordStore } from '../store/useRecordStore';
import { MainTabScreenProps } from '../navigation/types';
import { LabTestRecord, TestParameter } from '../types';

type Props = MainTabScreenProps<'History'>;

type TabType = 'documents' | 'tests';

const HistoryScreen: React.FC<Props> = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { records, labTestRecords } = useRecordStore();
  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'Prescription':
        return Pill;
      case 'Lab Report':
        return FlaskConical;
      default:
        return Activity;
    }
  };

  const getDocColor = (type: string) => {
    switch (type) {
      case 'Prescription':
        return { bg: colors.blue[100], text: colors.blue[600] };
      case 'Lab Report':
        return { bg: colors.purple[100], text: colors.purple[600] };
      default:
        return { bg: colors.primary[100], text: colors.primary[600] };
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent':
        return { bg: colors.emerald[50], text: colors.emerald[600] };
      case 'Good':
        return { bg: colors.green[100], text: colors.green[600] };
      case 'Fair':
        return { bg: colors.amber[50], text: colors.amber[800] };
      case 'Needs Attention':
        return { bg: colors.orange[50], text: colors.orange[500] };
      case 'Critical':
        return { bg: colors.red[50], text: colors.red[500] };
      default:
        return { bg: colors.gray[50], text: colors.gray[600] };
    }
  };

  const getStatusIcon = (status: TestParameter['status']) => {
    switch (status) {
      case 'high':
        return <TrendingUp size={12} color={colors.amber[800]} />;
      case 'low':
        return <TrendingDown size={12} color={colors.blue[600]} />;
      case 'critical':
        return <AlertTriangle size={12} color={colors.red[500]} />;
      default:
        return <CheckCircle2 size={12} color={colors.green[500]} />;
    }
  };

  const handleRecordPress = (recordId: string) => {
    navigation.navigate('Detail', { recordId } as never);
  };

  const handleLabTestPress = (labTestId: string) => {
    navigation.navigate('LabTestDetail', { labTestId } as never);
  };

  // Filter records based on search query
  const filteredRecords = records.filter(record => 
    record.analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.analysis.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.analysis.facilityName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLabTests = labTestRecords.filter(test =>
    test.analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.analysis.labName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.analysis.referringDoctor?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDocumentsList = () => {
    if (filteredRecords.length === 0) {
      return (
        <EmptyState
          icon={<FileText size={32} color={colors.gray[300]} />}
          title="No documents found"
          message={searchQuery ? "Try a different search term" : "Scan a document to get started"}
        />
      );
    }

    return (
      <View style={styles.recordsList}>
        {filteredRecords.map((record) => {
          const Icon = getDocIcon(record.analysis.documentType);
          const colors_doc = getDocColor(record.analysis.documentType);
          
          return (
            <TouchableOpacity
              key={record.id}
              style={styles.recordCard}
              onPress={() => handleRecordPress(record.id)}
              activeOpacity={0.8}
            >
              <View style={styles.recordHeader}>
                <View style={[styles.recordIcon, { backgroundColor: colors_doc.bg }]}>
                  <Icon size={20} color={colors_doc.text} />
                </View>
                <View style={styles.recordTitleContainer}>
                  <Text style={styles.recordTitle}>{record.analysis.title}</Text>
                  <Text style={styles.recordSource}>
                    {record.analysis.facilityName || record.analysis.doctorName || 'Unknown Source'}
                  </Text>
                </View>
                <Text style={styles.recordDate}>{record.analysis.date}</Text>
              </View>
              
              <View style={styles.recordSummary}>
                <Text style={styles.summaryText} numberOfLines={2}>
                  {record.analysis.summary}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderLabTestsList = () => {
    if (filteredLabTests.length === 0) {
      return (
        <EmptyState
          icon={<FlaskConical size={32} color={colors.gray[300]} />}
          title="No lab tests found"
          message={searchQuery ? "Try a different search term" : "Analyze a lab report to get started"}
        />
      );
    }

    return (
      <View style={styles.recordsList}>
        {filteredLabTests.map((test) => {
          const conditionColors = getConditionColor(test.analysis.conditionAssessment);
          
          return (
            <TouchableOpacity 
              key={test.id} 
              style={styles.testCard}
              onPress={() => handleLabTestPress(test.id)}
              activeOpacity={0.8}
            >
              {/* Test Header */}
              <View style={styles.testHeader}>
                <View style={[styles.recordIcon, { backgroundColor: colors.purple[50] }]}>
                  <FlaskConical size={20} color={colors.purple[600]} />
                </View>
                <View style={styles.recordTitleContainer}>
                  <Text style={styles.recordTitle}>{test.analysis.title}</Text>
                  <Text style={styles.recordSource}>
                    {test.analysis.labName || 'Unknown Lab'}
                  </Text>
                </View>
                <View style={styles.testHeaderRight}>
                  <Text style={styles.recordDate}>{test.analysis.date}</Text>
                  <ChevronRight size={20} color={colors.gray[400]} />
                </View>
              </View>

              {/* Condition Badge */}
              <View style={[styles.conditionBadge, { backgroundColor: conditionColors.bg }]}>
                <Heart size={14} color={conditionColors.text} />
                <Text style={[styles.conditionText, { color: conditionColors.text }]}>
                  {test.analysis.conditionAssessment}
                </Text>
              </View>

              {/* Health Summary */}
              <View style={styles.healthSummary}>
                <Sparkles size={14} color={colors.gray[500]} />
                <Text style={styles.healthSummaryText} numberOfLines={2}>
                  {test.analysis.healthSummary}
                </Text>
              </View>

              {/* Key Findings Preview */}
              {test.analysis.keyFindings.length > 0 && (
                <View style={styles.keyFindingsPreview}>
                  <AlertTriangle size={12} color={colors.amber[800]} />
                  <Text style={styles.keyFindingsText} numberOfLines={1}>
                    {test.analysis.keyFindings[0]}
                    {test.analysis.keyFindings.length > 1 && ` (+${test.analysis.keyFindings.length - 1} more)`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing['4'] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notebook</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'documents' ? 'Medical Documents' : 'Lab Test Results'}
        </Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
          onPress={() => setActiveTab('documents')}
          activeOpacity={0.8}
        >
          <FileText size={18} color={activeTab === 'documents' ? colors.primary[600] : colors.gray[400]} />
          <Text style={[styles.tabText, activeTab === 'documents' && styles.activeTabText]}>
            Documents
          </Text>
          <View style={[styles.tabBadge, activeTab === 'documents' && styles.activeTabBadge]}>
            <Text style={[styles.tabBadgeText, activeTab === 'documents' && styles.activeTabBadgeText]}>
              {records.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'tests' && styles.activeTab]}
          onPress={() => setActiveTab('tests')}
          activeOpacity={0.8}
        >
          <FlaskConical size={18} color={activeTab === 'tests' ? colors.purple[600] : colors.gray[400]} />
          <Text style={[styles.tabText, activeTab === 'tests' && styles.activeTabTextPurple]}>
            Lab Tests
          </Text>
          <View style={[styles.tabBadge, activeTab === 'tests' && styles.activeTabBadgePurple]}>
            <Text style={[styles.tabBadgeText, activeTab === 'tests' && styles.activeTabBadgeTextPurple]}>
              {labTestRecords.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'documents' ? "Search documents..." : "Search lab tests..."}
          placeholderTextColor={colors.gray[400]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content */}
      {activeTab === 'documents' ? renderDocumentsList() : renderLabTestsList()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing['6'],
    paddingBottom: spacing['24'],
  },
  header: {
    marginBottom: spacing['4'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing['1'],
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing['1'],
    marginBottom: spacing['4'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2'],
    paddingVertical: spacing['3'],
    borderRadius: borderRadius.xl,
  },
  activeTab: {
    backgroundColor: colors.primary[50],
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.gray[400],
  },
  activeTabText: {
    color: colors.primary[600],
  },
  activeTabTextPurple: {
    color: colors.purple[600],
  },
  tabBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing['2'],
    paddingVertical: spacing['0.5'],
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: colors.primary[100],
  },
  activeTabBadgePurple: {
    backgroundColor: colors.purple[100],
  },
  tabBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray[500],
  },
  activeTabBadgeText: {
    color: colors.primary[600],
  },
  activeTabBadgeTextPurple: {
    color: colors.purple[600],
  },
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['4'],
    marginBottom: spacing['6'],
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing['3'],
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  // Records List
  recordsList: {
    gap: spacing['4'],
  },
  recordCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['6'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing['4'],
  },
  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing['3'],
  },
  recordTitleContainer: {
    flex: 1,
  },
  recordTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  recordSource: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing['1'],
  },
  recordDate: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  recordSummary: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing['3'],
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  // Test Card Styles
  testCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['3xl'],
    padding: spacing['5'],
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  testHeaderRight: {
    alignItems: 'flex-end',
    gap: spacing['2'],
  },
  conditionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'],
    borderRadius: borderRadius.xl,
    alignSelf: 'flex-start',
    marginTop: spacing['3'],
  },
  conditionText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  healthSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing['2'],
    marginTop: spacing['3'],
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing['3'],
  },
  healthSummaryText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  // Expanded Content
  expandedContent: {
    marginTop: spacing['4'],
    paddingTop: spacing['4'],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  findingsSection: {
    marginBottom: spacing['4'],
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing['2'],
  },
  findingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing['2'],
    marginBottom: spacing['2'],
  },
  findingText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.amber[800],
    lineHeight: 18,
  },
  categorySection: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing['3'],
    marginBottom: spacing['3'],
  },
  categoryTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing['2'],
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['1'],
  },
  paramName: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  paramValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1'],
  },
  paramValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.text.primary,
  },
  moreText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing['2'],
    fontStyle: 'italic',
  },
  recommendationsSection: {
    marginTop: spacing['2'],
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing['2'],
    marginBottom: spacing['2'],
  },
  recommendationText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.indigo[800],
    lineHeight: 18,
  },
  keyFindingsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2'],
    marginTop: spacing['3'],
    paddingTop: spacing['3'],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  keyFindingsText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.amber[800],
    lineHeight: 16,
  },
});

export default HistoryScreen;
