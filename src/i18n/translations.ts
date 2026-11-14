import type { AppLanguage } from '../types';

export interface TranslationBundle {
  nav: {
    dashboard: string;
    voice: string;
    cropDoctor: string;
    profile: string;
    history: string;
    settings: string;
    logout: string;
    tagline: string;
  };
  logoutModal: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    loading: string;
    retry: string;
    continueConv: string;
    connected: string;
    notConfigured: string;
    error: string;
    locationNotSet: string;
    updateLocation: string;
  };
  auth: {
    loadingApp: string;
    tagline: string;
    heroTitle: string;
    heroDesc: string;
    prototypeTitle: string;
    prototypeDesc: string;
    farmerLogin: string;
    createAccountTitle: string;
    loginSubtitle: string;
    registerSubtitle: string;
    username: string;
    usernamePlaceholder: string;
    password: string;
    passwordLoginPlaceholder: string;
    passwordRegisterPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    loginBtn: string;
    createAccountBtn: string;
    newToApp: string;
    alreadyAccount: string;
    backToLogin: string;
    welcomeTitle: string;
    farmLocationSetTo: string;
    yourFarm: string;
    openDashboard: string;
    errUsernameMin: string;
    errPasswordMin: string;
    errPasswordMismatch: string;
    errAuthFailed: string;
    errSessionExpired: string;
    featWeather: string;
    featCropDoctor: string;
    featMarketPrices: string;
    featGovtSchemes: string;
    orDivider: string;
  };
  locationModal: {
    title: string;
    subtitlePrefix: string;
    subtitleSuffix: string;
    closeAria: string;
    privacyNote: string;
    detecting: string;
    allowGps: string;
    enterManuallyBtn: string;
    signInAgain: string;
    searchLabel: string;
    searchPlaceholder: string;
    searchBtn: string;
    manualEntryTitle: string;
    villagePlaceholder: string;
    districtPlaceholder: string;
    statePlaceholder: string;
    saving: string;
    saveLocation: string;
    errSessionExpired: string;
    errGeoUnsupported: string;
    errReverseFallback: string;
    errPermissionDenied: string;
    errDetectFailed: string;
    errSearchEmpty: string;
    errSearchUnavailable: string;
    errSelectSave: string;
    errVillageRequired: string;
    errManualSave: string;
  };
  audioPlayer: {
    playAria: string;
    pauseAria: string;
    speechBadge: string;
    gnaniTimbre: string;
    geminiTts: string;
    deviceSpeech: string;
    downloadAudio: string;
    downloadAudioUnavailable: string;
    downloadAudioSuccess: string;
    retryAudio: string;
    retryingAudio: string;
    audioUnavailable: string;
    audioLoadError: string;
    loadingDuration: string;
    stopAria: string;
    stopSpeaking: string;
    resumeAria: string;
    startAudioBtn: string;
    autoplayBlockedHint: string;
  };
  dashboard: {
    loadingDashboard: string;
    unableToLoad: string;
    welcomePrefix: string;
    companionLine: string;
    yourFarmLocation: string;
    manualNoGps: string;
    mapView: string;
    setGps: string;
    weatherToday: string;
    openMeteoLive: string;
    unavailable: string;
    humidity: string;
    wind: string;
    rainChance: string;
    next3Days: string;
    rainLabel: string;
    liveWeatherUnavailable: string;
    setGeocodedLocation: string;
    updatedLabel: string;
    marketPriceToday: string;
    liveAgmarknet: string;
    cachedAgmarknet: string;
    notConfiguredBadge: string;
    unavailableBadge: string;
    emptyBadge: string;
    refreshBtn: string;
    showingRatesFor: string;
    minMaxLabel: string;
    minPriceLabel: string;
    maxPriceLabel: string;
    modalPriceLabel: string;
    dataDateLabel: string;
    lastUpdatedLabel: string;
    arrivalLabel: string;
    noMandiMatch: string;
    mandiUnavailableTitle: string;
    mandiCachedNotice: string;
    mandiNotConfiguredDesc: string;
    mandiUnavailableDesc: string;
    mandiRefusedDesc: string;
    mandiTimeoutDesc: string;
    mandiInvalidKeyDesc: string;
    mandiRateLimitedDesc: string;
    myFarmDetails: string;
    totalArea: string;
    notSet: string;
    cropsLabel: string;
    noneSelected: string;
    soilLabel: string;
    irrigationLabel: string;
    stageLabel: string;
    sownLabel: string;
    govtSchemesTitle: string;
    prevScheme: string;
    nextScheme: string;
    officialPortal: string;
    verifiedLabel: string;
    workReminders: string;
    addReminder: string;
    noReminders: string;
    markComplete: string;
    markIncomplete: string;
    snoozeTip: string;
    editTip: string;
    deleteTip: string;
    recentConversations: string;
    viewHistory: string;
    noConversations: string;
    voiceAssistantLabel: string;
    cropDoctorLabel: string;
    continueBtn: string;
    farmLocationQuickActions: string;
    changeBtn: string;
    districtLabel: string;
    stateLabel: string;
    updateFarmDetails: string;
    openCropDoctor: string;
    voiceAssistantAction: string;
    setWorkReminder: string;
    editFarmTitle: string;
    totalLandArea: string;
    unitLabel: string;
    acres: string;
    hectares: string;
    cropsGrownMultiple: string;
    addAnotherCropPlaceholder: string;
    addBtn: string;
    soilTypeLabel: string;
    irrigationSourceLabel: string;
    sowingDateOpt: string;
    growthStageOpt: string;
    growthStagePlaceholder: string;
    savingBtn: string;
    saveFarmBtn: string;
    editReminderTitle: string;
    addReminderTitle: string;
    taskTitleLabel: string;
    taskTitlePlaceholder: string;
    dateLabel: string;
    timeLabel: string;
    cropOptionalLabel: string;
    generalAllCrops: string;
    saveReminderBtn: string;
    saveFarmError: string;
    soilTypes: Record<'Black' | 'Red' | 'Alluvial' | 'Sandy' | 'Clay' | 'Other', string>;
    irrigationTypes: Record<'Borewell' | 'Canal' | 'Drip' | 'Sprinkler' | 'Rain-fed' | 'Other', string>;
    weatherCodes: Record<number, string>;
    weatherVariable: string;
    schemeStatusMatched: string;
    schemeStatusRelevant: string;
  };
  voice: {
    poweredByGnani: string;
    gnaniNotConfiguredFallback: string;
    prismaSttLabel: string;
    timbreTtsLabel: string;
    echoProtectionNote: string;
    talkToPrefix: string;
    subtitle: string;
    stateReady: string;
    stateAutoListening: string;
    stateListening: string;
    statePaused: string;
    stateUnderstanding: string;
    statePreparing: string;
    stateProcessing: string;
    stateSpeaking: string;
    stateSpeakingLang: string;
    stateError: string;
    autoDetectBtn: string;
    autoDetectActiveBadge: string;
    manualOverrideBadge: string;
    detectedLabel: string;
    langNameTe: string;
    langNameEn: string;
    langNameHi: string;
    startBtn: string;
    pauseBtn: string;
    resumeBtn: string;
    stopSendBtn: string;
    resetBtn: string;
    tryAsking: string;
    voiceConversation: string;
    messagesUnit: string;
    noTurnsTitle: string;
    noTurnsSubtitle: string;
    sttBadge: string;
    ttsBadge: string;
    typedLabel: string;
    inputPlaceholder: string;
    sendAria: string;
    startAria: string;
    stopAria: string;
    errEchoLock: string;
    errUnsupportedBrowser: string;
    errMicDenied: string;
    errMicStart: string;
    errRecordingShort: string;
    errNoSpeech: string;
    errUnclearSpeech: string;
    ttsWarningPrefix: string;
    errSttFailed: string;
    errAskFailed: string;
    continuousModeLabel: string;
    continuousModeOn: string;
    continuousModeOff: string;
    stopSpeakingBtn: string;
    pauseSpeakingBtn: string;
    resumeSpeakingBtn: string;
    startAudioBtn: string;
    autoplayBlockedHint: string;
    stateSpeakingPaused: string;
  };
  cropDoctor: {
    title: string;
    subtitle: string;
    uploadCropImage: string;
    removeBtn: string;
    dragDropPrompt: string;
    formatLimit: string;
    cameraBtn: string;
    galleryBtn: string;
    replaceBtn: string;
    previewPlaceholder: string;
    cropNameLabel: string;
    cropNamePlaceholder: string;
    locationLabel: string;
    locationPlaceholder: string;
    growthStageLabel: string;
    growthStagePlaceholder: string;
    notePlaceholder: string;
    inspectingPhoto: string;
    analyzeCropBtn: string;
    emptyAnalysisHint: string;
    visualInspectionFinding: string;
    photoUnclearBadge: string;
    possibleIssueBadge: string;
    cropCardLabel: string;
    observedSeverityLabel: string;
    symptomsNoteLabel: string;
    conversationTitle: string;
    savedToHistory: string;
    emptyConversationHint: string;
    youLabel: string;
    doctorAiLabel: string;
    followUpPlaceholder: string;
    followUpDisabledPlaceholder: string;
    verifiedSuggestionsTitle: string;
    ipmTag: string;
    verifiedEmptyHint: string;
    verifiedUnclearWarning: string;
    verifiedNoMatch: string;
    ipmBioBadge: string;
    activeLabel: string;
    packLabel: string;
    priceLabel: string;
    checkDealerPrice: string;
    sourceBtn: string;
    viewProductBtn: string;
    searchProductBtn: string;
    careTipsTitle: string;
    preventionTipsTitle: string;
    errUnsupportedFormat: string;
    errSizeLimit: string;
    errReadFail: string;
    errUploadFirst: string;
    errAnalyzeFail: string;
    errFollowUpFail: string;
    errTimeout: string;
    errInvalidResponse: string;
    retryAnalyzeBtn: string;
    analyzingConversationHint: string;
    analyzingSubHint: string;
  };
  profile: {
    title: string;
    subtitle: string;
    personalDetails: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    mobileNumberLabel: string;
    digitsSuffix: string;
    mobilePlaceholder: string;
    mobileHelp: string;
    emailLabel: string;
    optionalLabel: string;
    validEmail: string;
    invalidFormat: string;
    emailPlaceholder: string;
    verifyMobileTitle: string;
    verifyEmailTitle: string;
    verifiedBadge: string;
    unverifiedBadge: string;
    serviceNotConfigured: string;
    smsOtpNotice: string;
    emailOtpNotice: string;
    sendOtpUnavailable: string;
    verifyEmailUnavailable: string;
    readyToVerifyPrefix: string;
    enterMobileFirst: string;
    enterEmailFirst: string;
    sendingBtn: string;
    resendInPrefix: string;
    resendOtpBtn: string;
    sendOtpBtn: string;
    sendEmailOtpBtn: string;
    verifyingBtn: string;
    verifyConfirmBtn: string;
    safeTitle: string;
    safeSubtitle: string;
    cancelBtn: string;
    saveChangesBtn: string;
    errNameRequired: string;
    errMobileInvalid: string;
    errEmailInvalid: string;
    errSaveFail: string;
    savedSuccess: string;
    errOtpDigits: string;
    errOtpVerifyFail: string;
  };
  history: {
    bannerTitlePrefix: string;
    bannerTitleHighlight: string;
    bannerSubtitle: string;
    voiceTabLabel: string;
    cropTabLabel: string;
    searchPlaceholder: string;
    allTime: string;
    today: string;
    last7d: string;
    last30d: string;
    voiceListTitle: string;
    noVoiceMatch: string;
    voiceSelectPrompt: string;
    languageLabel: string;
    cropListTitle: string;
    noCropMatch: string;
    cropSelectPrompt: string;
    careTipsTitle: string;
    preventionTipsTitle: string;
    verifiedProductsTitle: string;
    sourceBtn: string;
    viewProductBtn: string;
    searchProductBtn: string;
    youLabel: string;
    doctorAiLabel: string;
    continueBtn: string;
    deleteBtn: string;
    deleteModalTitle: string;
    deleteConfirmPrefix: string;
    deletingBtn: string;
    farmLabel: string;
    downloadPdfBtn: string;
    downloadZipBtn: string;
    downloadAllBtn: string;
    downloadingLabel: string;
    downloadSuccess: string;
    downloadError: string;
    noHistoryToExport: string;
  };
  settings: {
    pageTitle: string;
    pageSubtitle: string;
    bannerTitle: string;
    bannerSubtitle: string;
    languageTitle: string;
    languageDesc: string;
    voiceTitle: string;
    voiceDesc: string;
    voiceModelLabel: string;
    voiceSpeedLabel: string;
    voiceStyleLabel: string;
    voiceStyleNormal: string;
    voiceStyleClear: string;
    voiceStyleConcise: string;
    voiceSupportNoteConfigured: string;
    voiceSupportNoteFallback: string;
    notificationsTitle: string;
    notificationsDesc: string;
    notifReminders: string;
    notifWeather: string;
    notifSchemes: string;
    notifCropAdvice: string;
    themeTitle: string;
    themeDesc: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    appPrefsTitle: string;
    appPrefsDesc: string;
    unitsLabel: string;
    acres: string;
    hectares: string;
    defaultLocationLabel: string;
    seasonLabel: string;
    reminderTimeLabel: string;
    privacyTitle: string;
    privacyDesc: string;
    privacyExplain: string;
    downloadData: string;
    deleteData: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    helpTitle: string;
    helpDesc: string;
    faqHeading: string;
    faqs: Array<{ q: string; a: string }>;
    guideHeading: string;
    guideSteps: string[];
    supportContactNote: string;
    aboutTitle: string;
    aboutVersion: string;
    aboutDesc: string;
    integrationsHeading: string;
    resetDefaults: string;
    saveChanges: string;
    savedToast: string;
    resetToast: string;
    deletedToast: string;
    errorToast: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, TranslationBundle> = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      voice: 'Voice Assistant',
      cropDoctor: 'Crop Doctor AI',
      profile: 'Profile',
      history: 'History',
      settings: 'Settings',
      logout: 'Logout',
      tagline: 'AI-Powered Farming Assistant',
    },
    logoutModal: {
      title: 'Log out of GnaniKisan AI?',
      description: 'Your saved farm details, profile, and conversation history remain safely stored for your account.',
      cancel: 'Cancel',
      confirm: 'Yes, Logout',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      loading: 'Loading...',
      retry: 'Retry',
      continueConv: 'Continue Conversation',
      connected: 'Connected',
      notConfigured: 'Not Configured',
      error: 'Error',
      locationNotSet: 'Location not set',
      updateLocation: 'Update Location',
    },
    auth: {
      loadingApp: 'Loading GnaniKisan AI...',
      tagline: 'AI-Powered Farming Assistant',
      heroTitle: 'Your trusted farming companion in Telugu, English & Hindi.',
      heroDesc: 'Live weather forecasts, crop-specific mandi tracking, cautious Crop Doctor leaf checks, and government scheme discovery tailored to your farm.',
      prototypeTitle: 'Prototype Local Authentication',
      prototypeDesc: 'Passwords are salted and hashed server-side using scrypt and stored with HttpOnly session cookies — never in plaintext.',
      farmerLogin: 'Farmer Login',
      createAccountTitle: 'Create Account',
      loginSubtitle: 'Sign in to access your farm dashboard and saved history.',
      registerSubtitle: 'Create a personal GnaniKisan AI account in seconds.',
      username: 'Username',
      usernamePlaceholder: 'Enter your username',
      password: 'Password',
      passwordLoginPlaceholder: 'Enter password',
      passwordRegisterPlaceholder: 'Minimum 6 characters',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      loginBtn: 'Login',
      createAccountBtn: 'Create Account',
      newToApp: 'New to GnaniKisan AI?',
      alreadyAccount: 'Already have an account?',
      backToLogin: 'Back to Login',
      welcomeTitle: 'Welcome to GnaniKisan AI, {username}',
      farmLocationSetTo: 'Farm location set to',
      yourFarm: 'your farm',
      openDashboard: 'Open Dashboard',
      errUsernameMin: 'Username must be at least 3 characters.',
      errPasswordMin: 'Password must be at least 6 characters.',
      errPasswordMismatch: 'Passwords do not match.',
      errAuthFailed: 'Authentication failed.',
      errSessionExpired: 'Your login session expired. Please sign in again to save your farm location.',
      featWeather: 'Live Weather',
      featCropDoctor: 'Crop Doctor',
      featMarketPrices: 'Market Prices',
      featGovtSchemes: 'Govt. Schemes',
      orDivider: 'or',
    },
    locationModal: {
      title: 'Set Your Farm Location',
      subtitlePrefix: 'Hi',
      subtitleSuffix: 'location is used for live weather, local mandi references, and state schemes.',
      closeAria: 'Close location modal',
      privacyNote: 'Your coordinates are requested only with your permission and never invented. If GPS or place lookup is unavailable, enter your village, district, and state manually below without any external API key.',
      detecting: 'Detecting Location...',
      allowGps: 'Allow Location Access (GPS)',
      enterManuallyBtn: 'Enter Location Manually',
      signInAgain: 'Sign In Again',
      searchLabel: 'Search Indian Village / Town / District (Optional Geocoding)',
      searchPlaceholder: 'e.g., Rajahmundry, Guntur, Warangal...',
      searchBtn: 'Search',
      manualEntryTitle: 'Manual Location Entry',
      villagePlaceholder: 'Village / Town *',
      districtPlaceholder: 'District',
      statePlaceholder: 'State (e.g., Andhra Pradesh)',
      saving: 'Saving...',
      saveLocation: 'Save Location',
      errSessionExpired: 'Your login session expired or could not be verified. Please sign in again to save your farm location.',
      errGeoUnsupported: 'Location services are unavailable in this browser. Please enter your village, district, and state manually below.',
      errReverseFallback: 'Automatic address lookup is unavailable right now. Your GPS coordinates were captured—enter your village, district, and state manually below to save.',
      errPermissionDenied: 'Location permission was denied. Enter your village, district, and state manually below.',
      errDetectFailed: 'Unable to detect GPS coordinates right now. Please enter your village, district, and state manually below.',
      errSearchEmpty: 'No matching Indian locations found. Enter your village, district, and state manually below.',
      errSearchUnavailable: 'Place search is unavailable right now. Enter your village, district, and state manually below.',
      errSelectSave: 'Could not save selected location. Please try again.',
      errVillageRequired: 'Please enter your village, town, or city name.',
      errManualSave: 'Failed to save manual location. Please try again.',
    },
    audioPlayer: {
      playAria: 'Play voice playback',
      pauseAria: 'Pause voice playback',
      speechBadge: 'Speech',
      gnaniTimbre: 'Gnani Timbre',
      geminiTts: 'Gemini TTS',
      deviceSpeech: 'Device Speech',
      downloadAudio: 'Download Audio',
      downloadAudioUnavailable: 'Audio file unavailable for this response',
      downloadAudioSuccess: 'Audio downloaded',
      retryAudio: 'Retry Audio',
      retryingAudio: 'Generating audio...',
      audioUnavailable: 'Audio unavailable right now — read the text reply above or click Retry Audio.',
      audioLoadError: 'Could not play audio file. Click Retry Audio to regenerate.',
      loadingDuration: 'Loading...',
      stopAria: 'Stop speaking',
      stopSpeaking: 'Stop',
      resumeAria: 'Resume playback',
      startAudioBtn: 'Start Audio',
      autoplayBlockedHint: 'Browser blocked automatic audio — click Start Audio once to enable playback.',
    },
    dashboard: {
      loadingDashboard: 'Loading your farm dashboard...',
      unableToLoad: 'Unable to load dashboard.',
      welcomePrefix: 'Welcome,',
      companionLine: 'GnaniKisan AI — Your AI farming companion',
      yourFarmLocation: 'Your Farm Location',
      manualNoGps: 'Manual location (no GPS coordinates)',
      mapView: 'Map View',
      setGps: 'Set GPS',
      weatherToday: 'Weather Today',
      openMeteoLive: 'Open-Meteo Live',
      unavailable: 'Unavailable',
      humidity: 'Humidity',
      wind: 'Wind',
      rainChance: 'Rain Chance',
      next3Days: 'Next 3 Days',
      rainLabel: 'Rain',
      liveWeatherUnavailable: 'Live weather unavailable',
      setGeocodedLocation: 'Set Geocoded Location',
      updatedLabel: 'Updated',
      marketPriceToday: 'Market Price Today',
      liveAgmarknet: 'Live AGMARKNET',
      cachedAgmarknet: 'Cached AGMARKNET',
      notConfiguredBadge: 'Not Configured',
      unavailableBadge: 'Unavailable',
      emptyBadge: 'No Arrivals',
      refreshBtn: 'Refresh',
      showingRatesFor: 'Selected crops · Source:',
      minMaxLabel: 'Min–Max',
      minPriceLabel: 'Min',
      maxPriceLabel: 'Max',
      modalPriceLabel: 'Modal',
      dataDateLabel: 'Data date',
      lastUpdatedLabel: 'Last updated',
      arrivalLabel: 'Data date',
      noMandiMatch: 'No live AGMARKNET mandi arrivals matched your selected crops in the latest feed.',
      mandiUnavailableTitle: 'Live mandi prices currently unavailable',
      mandiCachedNotice: 'Live AGMARKNET is currently unreachable. Showing last verified cached prices from {date}.',
      mandiNotConfiguredDesc: 'DATA_GOV_API_KEY is not configured on the server. Add it to load live AGMARKNET rates.',
      mandiUnavailableDesc: 'Could not retrieve live AGMARKNET prices from data.gov.in right now. No fabricated prices are shown.',
      mandiRefusedDesc: 'The official AGMARKNET server (api.data.gov.in) refused outbound connections from this hosting environment. No fabricated prices are shown.',
      mandiTimeoutDesc: 'The official data.gov.in AGMARKNET API timed out while fetching live mandi rates. Please retry.',
      mandiInvalidKeyDesc: 'The configured DATA_GOV_API_KEY was rejected by data.gov.in. Verify your API key.',
      mandiRateLimitedDesc: 'data.gov.in API rate limit was reached. Please retry in a moment.',
      myFarmDetails: 'My Farm Details',
      totalArea: 'Total Area',
      notSet: 'Not set',
      cropsLabel: 'Crops',
      noneSelected: 'None selected',
      soilLabel: 'Soil',
      irrigationLabel: 'Irrigation',
      stageLabel: 'Stage',
      sownLabel: 'Sown',
      govtSchemesTitle: 'Govt Schemes for You',
      prevScheme: 'Previous scheme',
      nextScheme: 'Next scheme',
      officialPortal: 'Official Portal',
      verifiedLabel: 'Verified',
      workReminders: 'Work Reminders',
      addReminder: 'Add Reminder',
      noReminders: 'No reminders yet. Add irrigation, fertilizer, or field inspection reminders.',
      markComplete: 'Mark complete',
      markIncomplete: 'Mark incomplete',
      snoozeTip: 'Snooze 1 day',
      editTip: 'Edit reminder',
      deleteTip: 'Delete reminder',
      recentConversations: 'Recent Conversations',
      viewHistory: 'View History →',
      noConversations: 'No conversations yet. Start talking with Voice Assistant or upload a crop leaf in Crop Doctor AI.',
      voiceAssistantLabel: 'Voice Assistant',
      cropDoctorLabel: 'Crop Doctor AI',
      continueBtn: 'Continue',
      farmLocationQuickActions: 'Farm Location & Quick Actions',
      changeBtn: 'Change',
      districtLabel: 'District',
      stateLabel: 'State',
      updateFarmDetails: 'Update Farm Details',
      openCropDoctor: 'Open Crop Doctor',
      voiceAssistantAction: 'Voice Assistant',
      setWorkReminder: 'Set Work Reminder',
      editFarmTitle: 'Edit My Farm Details',
      totalLandArea: 'Total Land Area',
      unitLabel: 'Unit',
      acres: 'Acres',
      hectares: 'Hectares',
      cropsGrownMultiple: 'Crops Grown (Select multiple)',
      addAnotherCropPlaceholder: 'Add another crop...',
      addBtn: 'Add',
      soilTypeLabel: 'Soil Type',
      irrigationSourceLabel: 'Irrigation Source',
      sowingDateOpt: 'Sowing Date (Optional)',
      growthStageOpt: 'Growth Stage (Optional)',
      growthStagePlaceholder: 'e.g., Vegetative / Flowering',
      savingBtn: 'Saving...',
      saveFarmBtn: 'Save Farm Details',
      editReminderTitle: 'Edit Reminder',
      addReminderTitle: 'Add Work Reminder',
      taskTitleLabel: 'Task Title *',
      taskTitlePlaceholder: 'e.g., Check paddy bund water level',
      dateLabel: 'Date *',
      timeLabel: 'Time *',
      cropOptionalLabel: 'Crop (Optional)',
      generalAllCrops: 'General / All Crops',
      saveReminderBtn: 'Save Reminder',
      saveFarmError: 'Failed to save farm details.',
      soilTypes: {
        Black: 'Black',
        Red: 'Red',
        Alluvial: 'Alluvial',
        Sandy: 'Sandy',
        Clay: 'Clay',
        Other: 'Other',
      },
      irrigationTypes: {
        Borewell: 'Borewell',
        Canal: 'Canal',
        Drip: 'Drip',
        Sprinkler: 'Sprinkler',
        'Rain-fed': 'Rain-fed',
        Other: 'Other',
      },
      weatherCodes: {
        0: 'Clear Sky',
        1: 'Mainly Clear',
        2: 'Partly Cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Rime Fog',
        51: 'Light Drizzle',
        53: 'Moderate Drizzle',
        55: 'Dense Drizzle',
        61: 'Slight Rain',
        63: 'Moderate Rain',
        65: 'Heavy Rain',
        71: 'Slight Snow',
        80: 'Slight Showers',
        81: 'Moderate Showers',
        82: 'Heavy Showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with Hail',
      },
      weatherVariable: 'Variable Clouds',
      schemeStatusMatched: 'Criteria Matched (Verify on Portal)',
      schemeStatusRelevant: 'Potentially Relevant',
    },
    voice: {
      poweredByGnani: 'Powered by Gnani AI',
      gnaniNotConfiguredFallback: 'Gnani Speech Not Configured — Using Fallback',
      prismaSttLabel: 'Prisma STT',
      timbreTtsLabel: 'Timbre TTS',
      echoProtectionNote: 'Echo protection active during playback',
      talkToPrefix: 'Talk to',
      subtitle: 'Ask anything about your farm — crops, weather, market prices, soil, irrigation, or schemes',
      stateReady: 'Ready — Tap microphone to speak in Telugu, English, or Hindi',
      stateAutoListening: 'Auto-detecting your language...',
      stateListening: 'Listening...',
      statePaused: 'Paused',
      stateUnderstanding: 'Understanding your question...',
      statePreparing: 'Preparing your answer...',
      stateProcessing: 'Processing speech & farming answer...',
      stateSpeaking: 'Speaking answer (mic locked to prevent echo)...',
      stateSpeakingLang: 'Speaking in {lang}',
      stateError: 'Check microphone or use typed input',
      autoDetectBtn: 'Auto-Detect',
      autoDetectActiveBadge: 'Auto-Detect Active',
      manualOverrideBadge: 'Manual Language Lock',
      detectedLabel: 'Detected',
      langNameTe: 'Telugu',
      langNameEn: 'English',
      langNameHi: 'Hindi',
      startBtn: 'Start',
      pauseBtn: 'Pause',
      resumeBtn: 'Resume',
      stopSendBtn: 'Stop & Send',
      resetBtn: 'Reset',
      tryAsking: 'Try asking:',
      voiceConversation: 'Voice Conversation',
      messagesUnit: 'messages',
      noTurnsTitle: 'No turns in this session yet',
      noTurnsSubtitle: 'Tap Start to speak in Telugu, English, or Hindi — or type a farming question below.',
      sttBadge: 'STT',
      ttsBadge: 'TTS',
      typedLabel: 'Typed',
      inputPlaceholder: 'Type your farming question (fallback)...',
      sendAria: 'Send typed question',
      startAria: 'Start voice recording',
      stopAria: 'Stop and send recording',
      errEchoLock: 'Microphone paused while assistant voice playback is active to prevent echo.',
      errUnsupportedBrowser: 'Audio recording is not supported in this browser. Please use the text box.',
      errMicDenied: 'Microphone permission was denied. Enable mic access or type your question.',
      errMicStart: 'Unable to start microphone.',
      errRecordingShort: 'Recording was too short. Please speak clearly and try again.',
      errNoSpeech: 'Could not recognize speech from the recording. Please speak clearly or type your question.',
      errUnclearSpeech: 'Could not clearly identify your language or question. Please speak or type clearly in Telugu, English, or Hindi.',
      ttsWarningPrefix: 'Voice audio could not be generated; showing text reply.',
      errSttFailed: 'Speech recognition failed. Please try again or type your question.',
      errAskFailed: 'Assistant request failed.',
      continuousModeLabel: 'Continuous Conversation',
      continuousModeOn: 'ON',
      continuousModeOff: 'OFF',
      stopSpeakingBtn: 'Stop Speaking',
      pauseSpeakingBtn: 'Pause Audio',
      resumeSpeakingBtn: 'Resume Audio',
      startAudioBtn: 'Start Audio',
      autoplayBlockedHint: 'Your browser paused automatic playback. Tap Start Audio to play the response.',
      stateSpeakingPaused: 'Playback paused',
    },
    cropDoctor: {
      title: 'Crop Doctor AI',
      subtitle: 'Upload a crop photo, inspect visible symptoms, and get cautious care & IPM prevention tips.',
      uploadCropImage: 'Upload Crop Image',
      removeBtn: 'Remove',
      dragDropPrompt: 'Drag & drop or click to upload crop image',
      formatLimit: 'JPG, PNG, WEBP (max 10 MB)',
      cameraBtn: 'Camera',
      galleryBtn: 'Gallery',
      replaceBtn: 'Replace',
      previewPlaceholder: 'Uploaded crop preview appears here',
      cropNameLabel: 'Crop Name',
      cropNamePlaceholder: 'e.g., Paddy, Chilli',
      locationLabel: 'Location (Optional)',
      locationPlaceholder: 'District / State',
      growthStageLabel: 'Growth Stage (Optional)',
      growthStagePlaceholder: 'e.g., Tillering, Flowering',
      notePlaceholder: 'Optional note (e.g., yellowing spotted 3 days ago after rain)...',
      inspectingPhoto: 'Inspecting Photo...',
      analyzeCropBtn: 'Analyze Crop',
      emptyAnalysisHint: 'Upload a clear daylight close-up photo and click Analyze Crop to inspect visible symptoms.',
      visualInspectionFinding: 'Visual Inspection Finding',
      photoUnclearBadge: 'Photo Unclear — Retake Suggested',
      possibleIssueBadge: 'Possible Issue Noted',
      cropCardLabel: 'Crop',
      observedSeverityLabel: 'Observed Severity',
      symptomsNoteLabel: 'Visible Symptoms & Uncertainty Note',
      conversationTitle: 'Crop Doctor Conversation',
      savedToHistory: 'Saved to History',
      emptyConversationHint: 'Your analysis summary, voice playback, and follow-up Q&A will appear here.',
      youLabel: 'You',
      doctorAiLabel: 'GnaniCrop Doctor AI',
      followUpPlaceholder: 'Ask a follow-up question about this crop...',
      followUpDisabledPlaceholder: 'Analyze a crop photo first to ask follow-up questions',
      verifiedSuggestionsTitle: 'Verified Reference Suggestions (Up to 3)',
      ipmTag: 'IPM First · Label Guided',
      verifiedEmptyHint: 'Verified bio-control and registered reference options appear only after a clear visual assessment.',
      verifiedUnclearWarning: 'Chemical or input suggestions are withheld because the uploaded image is unclear. Please upload a sharper daylight close-up or consult your local KVK expert.',
      verifiedNoMatch: 'No verified catalog match found for this specific finding. Follow non-chemical Care & Prevention Tips below and consult your local Agriculture Officer / KVK.',
      ipmBioBadge: 'IPM / Bio',
      activeLabel: 'Active',
      packLabel: 'Pack',
      priceLabel: 'Price',
      checkDealerPrice: 'Check verified dealer (not fabricated)',
      sourceBtn: 'Source',
      viewProductBtn: 'View Product',
      searchProductBtn: 'Search product',
      careTipsTitle: 'Care Tips',
      preventionTipsTitle: 'Prevention Tips',
      errUnsupportedFormat: 'Unsupported format. Please upload a JPG, PNG, or WEBP image.',
      errSizeLimit: 'Image exceeds the 10 MB size limit. Please choose a smaller photo.',
      errReadFail: 'Failed to read the selected image.',
      errUploadFirst: 'Please upload or capture a crop/leaf photo first.',
      errAnalyzeFail: 'Unable to analyze crop image.',
      errFollowUpFail: 'Failed to send follow-up question.',
      errTimeout: 'Analysis took too long and timed out. Please check your connection and try again.',
      errInvalidResponse: 'Received an incomplete analysis from the server. Please try again.',
      retryAnalyzeBtn: 'Retry Analysis',
      analyzingConversationHint: 'Inspecting visible crop symptoms in English...',
      analyzingSubHint: 'Analyzing photo, preparing care guidance, and generating voice playback.',
    },
    profile: {
      title: 'My Profile',
      subtitle: 'Keep your details updated to get personalized farming advice, alerts, and scheme notifications.',
      personalDetails: 'Personal Details',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      mobileNumberLabel: 'Mobile Number',
      digitsSuffix: 'Digits',
      mobilePlaceholder: '10-digit Indian mobile number (or +91...)',
      mobileHelp: 'Used for SMS OTP verification and crop alerts when configured.',
      emailLabel: 'Email',
      optionalLabel: '(Optional)',
      validEmail: 'Valid Email',
      invalidFormat: 'Invalid format',
      emailPlaceholder: 'farmer@example.com',
      verifyMobileTitle: 'Verify Mobile Number',
      verifyEmailTitle: 'Verify Email',
      verifiedBadge: 'Verified',
      unverifiedBadge: 'Unverified',
      serviceNotConfigured: 'Verification service not configured',
      smsOtpNotice: 'Real SMS OTP requires Twilio Verify credentials on the server. Fake OTPs are never displayed.',
      emailOtpNotice: 'Real Email OTP requires Resend API configuration on the server.',
      sendOtpUnavailable: 'Send OTP (Unavailable)',
      verifyEmailUnavailable: 'Verify Email (Unavailable)',
      readyToVerifyPrefix: 'Ready to verify +91',
      enterMobileFirst: 'Enter a valid 10-digit number first',
      enterEmailFirst: 'Enter a valid optional email',
      sendingBtn: 'Sending...',
      resendInPrefix: 'Resend in',
      resendOtpBtn: 'Resend OTP',
      sendOtpBtn: 'Send OTP',
      sendEmailOtpBtn: 'Send Email OTP',
      verifyingBtn: 'Verifying...',
      verifyConfirmBtn: 'Verify & Confirm',
      safeTitle: 'Your information is safe and secure',
      safeSubtitle: 'Used exclusively to personalize your farming guidance, weather alerts, and scheme relevance.',
      cancelBtn: 'Cancel',
      saveChangesBtn: 'Save Changes',
      errNameRequired: 'Full Name is required.',
      errMobileInvalid: 'Please enter a valid 10-digit Indian mobile number (or +91 followed by 10 digits).',
      errEmailInvalid: 'Please enter a valid email address.',
      errSaveFail: 'Failed to save profile.',
      savedSuccess: 'Profile details saved successfully.',
      errOtpDigits: 'Enter all 6 OTP digits.',
      errOtpVerifyFail: 'Verification failed.',
    },
    history: {
      bannerTitlePrefix: 'Your Conversation',
      bannerTitleHighlight: 'History',
      bannerSubtitle: 'Revisit, continue, or manage your past Voice Assistant and Crop Doctor AI interactions.',
      voiceTabLabel: 'Voice Assistant History',
      cropTabLabel: 'Crop Doctor History',
      searchPlaceholder: 'Search your history...',
      allTime: 'All Time',
      today: 'Today',
      last7d: 'Last 7 Days',
      last30d: 'Last 30 Days',
      voiceListTitle: 'Voice Assistant Conversations',
      noVoiceMatch: 'No Voice Assistant history records match your filter.',
      voiceSelectPrompt: 'Select a conversation to view full STT transcript and TTS audio playback.',
      languageLabel: 'Language',
      cropListTitle: 'Crop Doctor Analyses',
      noCropMatch: 'No Crop Doctor history records match your filter.',
      cropSelectPrompt: 'Select a crop analysis record to view the retained image, care tips, and chat.',
      careTipsTitle: 'Care Tips',
      preventionTipsTitle: 'Prevention Tips',
      verifiedProductsTitle: 'Referenced Verified Products',
      sourceBtn: 'Source',
      viewProductBtn: 'View Product',
      searchProductBtn: 'Search product',
      youLabel: 'You',
      doctorAiLabel: 'GnaniCrop Doctor AI',
      continueBtn: 'Continue Conversation',
      deleteBtn: 'Delete',
      deleteModalTitle: 'Delete History Record?',
      deleteConfirmPrefix: 'Are you sure you want to permanently delete',
      deletingBtn: 'Deleting...',
      farmLabel: 'Farm',
      downloadPdfBtn: 'Download Text (PDF)',
      downloadZipBtn: 'Download Complete Conversation',
      downloadAllBtn: 'Download All History',
      downloadingLabel: 'Preparing download...',
      downloadSuccess: 'Download ready.',
      downloadError: 'Failed to prepare download.',
      noHistoryToExport: 'No history records available to download yet.',
    },
    settings: {
      pageTitle: 'Settings',
      pageSubtitle: 'Customize GnaniKisan AI to suit your language and farm preferences',
      bannerTitle: 'Application Settings',
      bannerSubtitle: 'Manage language, voice playback, alerts, theme, preferences, and privacy.',
      languageTitle: 'Language',
      languageDesc: 'Choose the display and assistant response language',
      voiceTitle: 'Voice Settings',
      voiceDesc: 'Configure speech voice, playback speed, and response style',
      voiceModelLabel: 'Voice Profile',
      voiceSpeedLabel: 'Playback Speed',
      voiceStyleLabel: 'Response Style',
      voiceStyleNormal: 'Normal',
      voiceStyleClear: 'Detailed & Clear',
      voiceStyleConcise: 'Concise',
      voiceSupportNoteConfigured: 'Gnani Timbre TTS is connected on the server for Telugu, English, and Hindi.',
      voiceSupportNoteFallback: 'Gnani Timbre TTS key is not configured on the server; supported browser/Gemini speech fallback is used where available.',
      notificationsTitle: 'Notifications',
      notificationsDesc: 'Choose which in-app alerts you prefer to receive',
      notifReminders: 'Crop Work Reminders',
      notifWeather: 'Weather Alerts',
      notifSchemes: 'Government Scheme Updates',
      notifCropAdvice: 'Crop Care Advice',
      themeTitle: 'Theme',
      themeDesc: 'Switch between Light, Dark, or System appearance',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeSystem: 'System',
      appPrefsTitle: 'App Preferences',
      appPrefsDesc: 'Configure default units, location, season, and reminder schedule',
      unitsLabel: 'Measurement Units',
      acres: 'Acres',
      hectares: 'Hectares',
      defaultLocationLabel: 'Default Location',
      seasonLabel: 'Farming Season',
      reminderTimeLabel: 'Default Reminder Time',
      privacyTitle: 'Privacy & Data',
      privacyDesc: 'Review what is stored for your account and export or clear your records',
      privacyExplain:
        'Your account stores your username, hashed credentials, profile contact info, farm details, reminders, voice transcripts/audio clips, and Crop Doctor images/analyses on the application server exclusively for your user session.',
      downloadData: 'Download My Data (JSON)',
      deleteData: 'Delete My History & Farm Data',
      deleteConfirmTitle: 'Delete History & Farm Data?',
      deleteConfirmBody:
        'This permanently removes all your Voice Assistant conversations, Crop Doctor analyses, reminders, and farm details. Your login account stays intact.',
      helpTitle: 'Help & Support',
      helpDesc: 'Frequently asked questions, quick guide, and agricultural support guidance',
      faqHeading: 'Frequently Asked Questions',
      faqs: [
        {
          q: 'How do I ask questions in Telugu, Hindi, or English?',
          a: 'Open Voice Assistant, pick your language, and tap the central microphone or type your question in the text box.',
        },
        {
          q: 'Why does Crop Doctor ask for another photo sometimes?',
          a: 'Blurry, distant, or dark images prevent reliable visual inspection. Take a sharp daylight close-up showing the affected leaves or stems.',
        },
        {
          q: 'Are chemical spray dosages calculated automatically?',
          a: 'No. For safety, GnaniKisan AI never invents chemical dosages. Always follow the registered CIBRC product label and consult your local KVK or Agriculture Officer.',
        },
      ],
      guideHeading: 'Quick User Guide',
      guideSteps: [
        '1. Save your farm area, crops, soil, and irrigation in Dashboard -> My Farm Details.',
        '2. Use Voice Assistant for daily crop, weather, and scheme guidance in your language.',
        '3. Upload clear daylight photos in Crop Doctor AI for cautious visual inspection and IPM tips.',
      ],
      supportContactNote:
        'For local field agronomy verification, contact your nearest Krishi Vigyan Kendra (KVK) or State Agriculture Extension Officer.',
      aboutTitle: 'About GnaniKisan AI',
      aboutVersion: 'Version 1.0.0',
      aboutDesc:
        'GnaniKisan AI is an AI-powered farming companion designed for Indian farmers, combining multilingual voice assistance, cautious Crop Doctor visual guidance, live weather, mandi references, and government scheme discovery.',
      integrationsHeading: 'Live Service Status',
      resetDefaults: 'Reset to Defaults',
      saveChanges: 'Save Changes',
      savedToast: 'Settings saved successfully.',
      resetToast: 'Settings reset to defaults.',
      deletedToast: 'Your conversation history, reminders, and farm details have been deleted.',
      errorToast: 'Could not save settings. Please try again.',
    },
  },
  te: {
    nav: {
      dashboard: 'డ్యాష్‌బోర్డ్',
      voice: 'వాయిస్ అసిస్టెంట్',
      cropDoctor: 'క్రాప్ డాక్టర్ AI',
      profile: 'ప్రొఫైల్',
      history: 'చరిత్ర (History)',
      settings: 'సెట్టింగ్‌లు',
      logout: 'లాగ్ అవుట్',
      tagline: 'AI ఆధారిత వ్యవసాయ సహాయకుడు',
    },
    logoutModal: {
      title: 'GnaniKisan AI నుండి లాగ్ అవుట్ చేయాలా?',
      description: 'మీ సేవ్ చేసిన పొలం వివరాలు, ప్రొఫైల్ మరియు సంభాషణ చరిత్ర మీ ఖాతాలో సురక్షితంగా ఉంటాయి.',
      cancel: 'రద్దు చేయండి',
      confirm: 'అవును, లాగ్ అవుట్',
    },
    common: {
      save: 'సేవ్ చేయండి',
      cancel: 'రద్దు చేయండి',
      delete: 'తొలగించండి',
      edit: 'సవరించండి',
      close: 'మూసివేయండి',
      loading: 'లోడ్ అవుతోంది...',
      retry: 'మళ్లీ ప్రయత్నించండి',
      continueConv: 'సంభాషణ కొనసాగించండి',
      connected: 'కనెక్ట్ అయింది',
      notConfigured: 'సెట్ చేయబడలేదు',
      error: 'లోపం',
      locationNotSet: 'లొకేషన్ సెట్ చేయలేదు',
      updateLocation: 'లొకేషన్ మార్చండి',
    },
    auth: {
      loadingApp: 'GnaniKisan AI లోడ్ అవుతోంది...',
      tagline: 'AI ఆధారిత వ్యవసాయ సహాయకుడు',
      heroTitle: 'తెలుగు, ఇంగ్లీష్ & హిందీలో మీ నమ్మకమైన వ్యవసాయ సహాయకుడు.',
      heroDesc: 'లైవ్ వాతావరణ సూచనలు, పంటల మండి ధరలు, క్రాప్ డాక్టర్ ఆకు తనిఖీ మరియు మీ పొలానికి తగిన ప్రభుత్వ పథకాల సమాచారం.',
      prototypeTitle: 'లోకల్ ప్రోటోటైప్ లాగిన్ భద్రత',
      prototypeDesc: 'పాస్‌వర్డ్‌లు సర్వర్‌లో scrypt తో సురక్షితంగా హాష్ చేయబడతాయి మరియు HttpOnly కుకీలతో నిల్వ చేయబడతాయి.',
      farmerLogin: 'రైతు లాగిన్',
      createAccountTitle: 'కొత్త ఖాతా తెరవండి',
      loginSubtitle: 'మీ పొలం డ్యాష్‌బోర్డ్ మరియు సేవ్ చేసిన చరిత్రను చూడటానికి సైన్ ఇన్ చేయండి.',
      registerSubtitle: 'క్షణాల్లో మీ వ్యక్తిగత GnaniKisan AI ఖాతాను సృష్టించండి.',
      username: 'వినియోగదారు పేరు',
      usernamePlaceholder: 'మీ వినియోగదారు పేరు నమోదు చేయండి',
      password: 'పాస్‌వర్డ్',
      passwordLoginPlaceholder: 'పాస్‌వర్డ్ నమోదు చేయండి',
      passwordRegisterPlaceholder: 'కనీసం 6 అక్షరాలు',
      confirmPassword: 'పాస్‌వర్డ్ నిర్ధారించండి',
      confirmPasswordPlaceholder: 'మళ్లీ పాస్‌వర్డ్ నమోదు చేయండి',
      showPassword: 'పాస్‌వర్డ్ చూపించు',
      hidePassword: 'పాస్‌వర్డ్ దాచు',
      loginBtn: 'లాగిన్',
      createAccountBtn: 'ఖాతా సృష్టించండి',
      newToApp: 'GnaniKisan AI కి కొత్తవారా?',
      alreadyAccount: 'ఇప్పటికే ఖాతా ఉందా?',
      backToLogin: 'లాగిన్‌కు తిరిగి వెళ్ళండి',
      welcomeTitle: 'GnaniKisan AI కి స్వాగతం, {username}',
      farmLocationSetTo: 'పొలం లొకేషన్ సెట్ చేయబడింది:',
      yourFarm: 'మీ పొలం',
      openDashboard: 'డ్యాష్‌బోర్డ్ తెరవండి',
      errUsernameMin: 'వినియోగదారు పేరు కనీసం 3 అక్షరాలు ఉండాలి.',
      errPasswordMin: 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.',
      errPasswordMismatch: 'పాస్‌వర్డ్‌లు సరిపోలలేదు.',
      errAuthFailed: 'లాగిన్ విఫలమైంది.',
      errSessionExpired: 'మీ లాగిన్ సెషన్ గడువు ముగిసింది. పొలం లొకేషన్ సేవ్ చేయడానికి దయచేసి మళ్లీ సైన్ ఇన్ చేయండి.',
      featWeather: 'లైవ్ వాతావరణం',
      featCropDoctor: 'క్రాప్ డాక్టర్',
      featMarketPrices: 'మార్కెట్ ధరలు',
      featGovtSchemes: 'ప్రభుత్వ పథకాలు',
      orDivider: 'లేదా',
    },
    locationModal: {
      title: 'మీ పొలం లొకేషన్ సెట్ చేయండి',
      subtitlePrefix: 'నమస్కారం',
      subtitleSuffix: 'లైవ్ వాతావరణం, మండి ధరలు మరియు రాష్ట్ర పథకాల కోసం లొకేషన్ ఉపయోగించబడుతుంది.',
      closeAria: 'లొకేషన్ విండో మూసివేయండి',
      privacyNote: 'మీ అనుమతితో మాత్రమే GPS కోఆర్డినేట్‌లు తీసుకోబడతాయి. GPS లేదా శోధన అందుబాటులో లేకపోతే, కింద మీ గ్రామం, జిల్లా మరియు రాష్ట్రం వివరాలను స్వయంగా నమోదు చేయండి.',
      detecting: 'లొకేషన్ గుర్తిస్తోంది...',
      allowGps: 'లొకేషన్ అనుమతించండి (GPS)',
      enterManuallyBtn: 'స్వయంగా లొకేషన్ నమోదు చేయండి',
      signInAgain: 'మళ్లీ సైన్ ఇన్ చేయండి',
      searchLabel: 'గ్రామం / పట్టణం / జిల్లా వెతకండి (ఐచ్ఛికం)',
      searchPlaceholder: 'ఉదా., రాజమండ్రి, గుంటూరు, వరంగల్...',
      searchBtn: 'వెతకండి',
      manualEntryTitle: 'స్వయంగా లొకేషన్ నమోదు',
      villagePlaceholder: 'గ్రామం / పట్టణం *',
      districtPlaceholder: 'జిల్లా',
      statePlaceholder: 'రాష్ట్రం (ఉదా., ఆంధ్రప్రదేశ్)',
      saving: 'సేవ్ చేస్తోంది...',
      saveLocation: 'లొకేషన్ సేవ్ చేయండి',
      errSessionExpired: 'మీ లాగిన్ సెషన్ గడువు ముగిసింది లేదా ధృవీకరించబడలేదు. దయచేసి మళ్లీ సైన్ ఇన్ చేయండి.',
      errGeoUnsupported: 'ఈ బ్రౌజర్‌లో లొకేషన్ సేవ అందుబాటులో లేదు. కింద మీ గ్రామం, జిల్లా మరియు రాష్ట్రం నమోదు చేయండి.',
      errReverseFallback: 'ఆటోమేటిక్ అడ్రస్ lookup ప్రస్తుతం అందుబాటులో లేదు. మీ GPS కోఆర్డినేట్‌లు తీసుకోబడ్డాయి—సేవ్ చేయడానికి గ్రామం, జిల్లా, రాష్ట్రం నమోదు చేయండి.',
      errPermissionDenied: 'లొకేషన్ అనుమతి నిరాకరించబడింది. కింద మీ గ్రామం, జిల్లా మరియు రాష్ట్రం స్వయంగా నమోదు చేయండి.',
      errDetectFailed: 'ప్రస్తుతం GPS లొకేషన్ గుర్తించలేకపోయాము. కింద మీ గ్రామం, జిల్లా మరియు రాష్ట్రం స్వయంగా నమోదు చేయండి.',
      errSearchEmpty: 'సరిపోయే భారత లొకేషన్లు కనుగొనబడలేదు. కింద స్వయంగా నమోదు చేయండి.',
      errSearchUnavailable: 'లొకేషన్ శోధన ప్రస్తుతం అందుబాటులో లేదు. కింద స్వయంగా నమోదు చేయండి.',
      errSelectSave: 'ఎంచుకున్న లొకేషన్ సేవ్ చేయడం విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
      errVillageRequired: 'దయచేసి మీ గ్రామం లేదా పట్టణం పేరు నమోదు చేయండి.',
      errManualSave: 'లొకేషన్ సేవ్ చేయడం విఫలమైంది. దయచేసి మళ్లీ ప్రయత్నించండి.',
    },
    audioPlayer: {
      playAria: 'వాయిస్ ప్లే చేయండి',
      pauseAria: 'వాయిస్ ఆపండి',
      speechBadge: 'వాయిస్',
      gnaniTimbre: 'Gnani Timbre',
      geminiTts: 'Gemini TTS',
      deviceSpeech: 'డివైస్ వాయిస్',
      downloadAudio: 'ఆడియో డౌన్‌లోడ్',
      downloadAudioUnavailable: 'ఈ సమాధానానికి ఆడియో ఫైల్ అందుబాటులో లేదు',
      downloadAudioSuccess: 'ఆడియో డౌన్‌లోడ్ అయింది',
      retryAudio: 'ఆడియో మళ్లీ ప్రయత్నించండి',
      retryingAudio: 'ఆడియో తయారవుతోంది...',
      audioUnavailable: 'ఆడియో ప్రస్తుతం అందుబాటులో లేదు — పై సమాధానం చదవండి లేదా ఆడియో మళ్లీ ప్రయత్నించండి నొక్కండి.',
      audioLoadError: 'ఆడియో ప్లే చేయడం సాధ్యం కాలేదు. ఆడియో మళ్లీ ప్రయత్నించండి నొక్కండి.',
      loadingDuration: 'లోడ్ అవుతోంది...',
      stopAria: 'మాట్లాడటం ఆపండి',
      stopSpeaking: 'ఆపండి',
      resumeAria: 'తిరిగి ప్లే చేయండి',
      startAudioBtn: 'ఆడియో ప్రారంభించండి',
      autoplayBlockedHint: 'బ్రౌజర్ ఆటో ప్లేను నిరోధించింది — ఆడియో వినడానికి ప్రారంభించండి నొక్కండి.',
    },
    dashboard: {
      loadingDashboard: 'మీ పొలం డ్యాష్‌బోర్డ్ లోడ్ అవుతోంది...',
      unableToLoad: 'డ్యాష్‌బోర్డ్ లోడ్ చేయడం సాధ్యం కాలేదు.',
      welcomePrefix: 'స్వాగతం,',
      companionLine: 'GnaniKisan AI — మీ AI వ్యవసాయ సహాయకుడు',
      yourFarmLocation: 'మీ పొలం లొకేషన్',
      manualNoGps: 'మాన్యువల్ లొకేషన్ (GPS కోఆర్డినేట్లు లేవు)',
      mapView: 'మ్యాప్ చూడండి',
      setGps: 'GPS సెట్ చేయండి',
      weatherToday: 'నేటి వాతావరణం',
      openMeteoLive: 'Open-Meteo లైవ్',
      unavailable: 'అందుబాటులో లేదు',
      humidity: 'తేమ (Humidity)',
      wind: 'గాలి వేగం',
      rainChance: 'వర్ష సూచన',
      next3Days: 'రాబోయే 3 రోజులు',
      rainLabel: 'వర్షం',
      liveWeatherUnavailable: 'లైవ్ వాతావరణం అందుబాటులో లేదు',
      setGeocodedLocation: 'లొకేషన్ కోఆర్డినేట్లు సెట్ చేయండి',
      updatedLabel: 'నవీకరణ',
      marketPriceToday: 'నేటి మార్కెట్ ధరలు',
      liveAgmarknet: 'లైవ్ AGMARKNET',
      cachedAgmarknet: 'కాష్ చేసిన AGMARKNET',
      notConfiguredBadge: 'సెట్ చేయబడలేదు',
      unavailableBadge: 'అందుబాటులో లేదు',
      emptyBadge: 'ధరలు లేవు',
      refreshBtn: 'రిఫ్రెష్',
      showingRatesFor: 'ఎంచుకున్న పంటలు · మూలం:',
      minMaxLabel: 'కనిష్ట–గరిష్ట',
      minPriceLabel: 'కనిష్ట',
      maxPriceLabel: 'గరిష్ట',
      modalPriceLabel: 'మోడల్',
      dataDateLabel: 'డేటా తేదీ',
      lastUpdatedLabel: 'చివరి నవీకరణ',
      arrivalLabel: 'డేటా తేదీ',
      noMandiMatch: 'తాజా AGMARKNET ఫీడ్‌లో మీరు ఎంచుకున్న పంటలకు ధరలు కనిపించలేదు.',
      mandiUnavailableTitle: 'లైవ్ మండి ధరలు ప్రస్తుతం అందుబాటులో లేవు',
      mandiCachedNotice: 'ప్రస్తుతం లైవ్ AGMARKNET అందుబాటులో లేదు. {date} నాటి చివరి ధృవీకరించబడిన ధరలు చూపబడుతున్నాయి.',
      mandiNotConfiguredDesc: 'సర్వర్‌లో DATA_GOV_API_KEY సెట్ చేయబడలేదు. లైవ్ AGMARKNET ధరల కోసం API కీ జతచేయండి.',
      mandiUnavailableDesc: 'ప్రస్తుతం data.gov.in నుండి లైవ్ AGMARKNET ధరలను పొందలేకపోయాము. తప్పుడు ధరలు చూపబడవు.',
      mandiRefusedDesc: 'ఈ హోస్టింగ్ సర్వర్ నుండి అధికారిక AGMARKNET (api.data.gov.in) కనెక్షన్ నిరాకరించబడింది. తప్పుడు ధరలు చూపబడవు.',
      mandiTimeoutDesc: 'data.gov.in AGMARKNET API సమయం ముగిసింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
      mandiInvalidKeyDesc: 'DATA_GOV_API_KEY ను data.gov.in తిరస్కరించింది. API కీని తనిఖీ చేయండి.',
      mandiRateLimitedDesc: 'data.gov.in API పరిమితి పూర్తయింది. కాసేపట్లో మళ్లీ ప్రయత్నించండి.',
      myFarmDetails: 'నా పొలం వివరాలు',
      totalArea: 'మొత్తం విస్తీర్ణం',
      notSet: 'సెట్ చేయలేదు',
      cropsLabel: 'పంటలు',
      noneSelected: 'ఎంచుకోలేదు',
      soilLabel: 'నేల రకం',
      irrigationLabel: 'నీటిపారుదల',
      stageLabel: 'దశ',
      sownLabel: 'విత్తిన తేదీ',
      govtSchemesTitle: 'మీ కోసం ప్రభుత్వ పథకాలు',
      prevScheme: 'మునుపటి పథకం',
      nextScheme: 'తదుపరి పథకం',
      officialPortal: 'అధికారిక పోర్టల్',
      verifiedLabel: 'ధృవీకరించబడింది',
      workReminders: 'పొలం పనుల రిమైండర్లు',
      addReminder: 'రిమైండర్ జతచేయండి',
      noReminders: 'ఇంకా రిమైండర్లు లేవు. నీటిపారుదల, ఎరువులు లేదా పొలం తనిఖీ రిమైండర్లను జతచేయండి.',
      markComplete: 'పూర్తయినట్లు గుర్తించండి',
      markIncomplete: 'అసంపూర్ణంగా గుర్తించండి',
      snoozeTip: '1 రోజు వాయిదా వేయండి',
      editTip: 'రిమైండర్ సవరించండి',
      deleteTip: 'రిమైండర్ తొలగించండి',
      recentConversations: 'ఇటీవలి సంభాషణలు',
      viewHistory: 'చరిత్ర చూడండి →',
      noConversations: 'ఇంకా సంభాషణలు లేవు. వాయిస్ అసిస్టెంట్‌తో మాట్లాడండి లేదా క్రాప్ డాక్టర్ AI లో ఆకు ఫోటో అప్‌లోడ్ చేయండి.',
      voiceAssistantLabel: 'వాయిస్ అసిస్టెంట్',
      cropDoctorLabel: 'క్రాప్ డాక్టర్ AI',
      continueBtn: 'కొనసాగించండి',
      farmLocationQuickActions: 'పొలం లొకేషన్ & త్వరిత చర్యలు',
      changeBtn: 'మార్చండి',
      districtLabel: 'జిల్లా',
      stateLabel: 'రాష్ట్రం',
      updateFarmDetails: 'పొలం వివరాలు మార్చండి',
      openCropDoctor: 'క్రాప్ డాక్టర్ తెరవండి',
      voiceAssistantAction: 'వాయిస్ అసిస్టెంట్',
      setWorkReminder: 'పని రిమైండర్ పెట్టండి',
      editFarmTitle: 'నా పొలం వివరాలను సవరించండి',
      totalLandArea: 'మొత్తం భూమి విస్తీర్ణం',
      unitLabel: 'కొలత',
      acres: 'ఎకరాలు',
      hectares: 'హెక్టార్లు',
      cropsGrownMultiple: 'సాగు చేసే పంటలు (అనేకం ఎంచుకోవచ్చు)',
      addAnotherCropPlaceholder: 'మరో పంట పేరు రాయండి...',
      addBtn: 'జతచేయండి',
      soilTypeLabel: 'నేల రకం',
      irrigationSourceLabel: 'నీటిపారుదల వనరు',
      sowingDateOpt: 'విత్తిన తేదీ (ఐచ్ఛికం)',
      growthStageOpt: 'పంట దశ (ఐచ్ఛికం)',
      growthStagePlaceholder: 'ఉదా., పిలక దశ / పూత దశ',
      savingBtn: 'సేవ్ చేస్తోంది...',
      saveFarmBtn: 'పొలం వివరాలు సేవ్ చేయండి',
      editReminderTitle: 'రిమైండర్ సవరించండి',
      addReminderTitle: 'పొలం పని రిమైండర్ జతచేయండి',
      taskTitleLabel: 'పని పేరు *',
      taskTitlePlaceholder: 'ఉదా., వరి పొలంలో నీటి మట్టం తనిఖీ చేయండి',
      dateLabel: 'తేదీ *',
      timeLabel: 'సమయం *',
      cropOptionalLabel: 'పంట (ఐచ్ఛికం)',
      generalAllCrops: 'సాధారణ / అన్ని పంటలు',
      saveReminderBtn: 'రిమైండర్ సేవ్ చేయండి',
      saveFarmError: 'పొలం వివరాలు సేవ్ చేయడం విఫలమైంది.',
      soilTypes: {
        Black: 'నల్ల రేగడి నేల',
        Red: 'ఎర్ర నేల',
        Alluvial: 'ఒండ్రు నేల',
        Sandy: 'ఇసుక నేల',
        Clay: 'బంకమట్టి నేల',
        Other: 'ఇతరం',
      },
      irrigationTypes: {
        Borewell: 'బోర్‌వెల్',
        Canal: 'కాలువ',
        Drip: 'డ్రిప్ (బిందు సేద్యం)',
        Sprinkler: 'స్ప్రింక్లర్',
        'Rain-fed': 'వర్షాధారం',
        Other: 'ఇతరం',
      },
      weatherCodes: {
        0: 'నిర్మల ఆకాశం',
        1: 'ఎక్కువగా స్పష్టంగా',
        2: 'పాక్షిక మేఘావృతం',
        3: 'మేఘావృతం',
        45: 'పొగమంచు',
        48: 'దట్టమైన పొగమంచు',
        51: 'తేలికపాటి చినుకులు',
        53: 'మోస్తరు చినుకులు',
        55: 'దట్టమైన చినుకులు',
        61: 'తేలికపాటి వర్షం',
        63: 'మోస్తరు వర్షం',
        65: 'భారీ వర్షం',
        71: 'తేలికపాటి మంచు',
        80: 'తేలికపాటి జల్లులు',
        81: 'మోస్తరు జల్లులు',
        82: 'భారీ జల్లులు',
        95: 'ఉరుములతో వర్షం',
        96: 'వడగళ్లతో తుఫాను',
      },
      weatherVariable: 'మారే మేఘాలు',
      schemeStatusMatched: 'అర్హత సరిపోలింది (పోర్టల్‌లో తనిఖీ చేయండి)',
      schemeStatusRelevant: 'అనుకూలమైన పథకం',
    },
    voice: {
      poweredByGnani: 'Gnani AI ద్వారా నిర్వహించబడుతోంది',
      gnaniNotConfiguredFallback: 'Gnani స్పీచ్ సెట్ చేయబడలేదు — ఫాల్‌బ్యాక్ ఉపయోగించబడుతోంది',
      prismaSttLabel: 'Prisma STT',
      timbreTtsLabel: 'Timbre TTS',
      echoProtectionNote: 'వాయిస్ ప్లే సమయంలో ఎకో రక్షణ క్రియాశీలంగా ఉంటుంది',
      talkToPrefix: 'మాట్లాడండి:',
      subtitle: 'మీ పొలం గురించి ఏదైనా అడగండి — పంటలు, వాతావరణం, మార్కెట్ ధరలు, నేల, నీటిపారుదల లేదా పథకాలు',
      stateReady: 'సిద్ధంగా ఉంది — తెలుగు, ఇంగ్లీష్ లేదా హిందీలో మాట్లాడటానికి మైక్ నొక్కండి',
      stateAutoListening: 'మీ భాషను స్వయంచాలకంగా గుర్తిస్తోంది...',
      stateListening: 'వింటోంది...',
      statePaused: 'ఆపబడింది',
      stateUnderstanding: 'మీ ప్రశ్నను అర్థం చేసుకుంటోంది...',
      statePreparing: 'మీ సమాధానాన్ని సిద్ధం చేస్తోంది...',
      stateProcessing: 'మాటలను గుర్తించి సమాధానం తయారు చేస్తోంది...',
      stateSpeaking: 'సమాధానం వినిపిస్తోంది (ఎకో రాకుండా మైక్ లాక్ చేయబడింది)...',
      stateSpeakingLang: '{lang}లో మాట్లాడుతోంది',
      stateError: 'మైక్రోఫోన్ తనిఖీ చేయండి లేదా కింద టైప్ చేయండి',
      autoDetectBtn: 'ఆటో-డిటెక్ట్',
      autoDetectActiveBadge: 'ఆటో-డిటెక్ట్ సక్రియం',
      manualOverrideBadge: 'మాన్యువల్ భాష లాక్',
      detectedLabel: 'గుర్తించిన భాష',
      langNameTe: 'తెలుగు',
      langNameEn: 'ఇంగ్లీష్',
      langNameHi: 'హిందీ',
      startBtn: 'ప్రారంభించండి',
      pauseBtn: 'విరామం',
      resumeBtn: 'కొనసాగించండి',
      stopSendBtn: 'ఆపి పంపండి',
      resetBtn: 'రీసెట్',
      tryAsking: 'ఇలా అడగండి:',
      voiceConversation: 'వాయిస్ సంభాషణ',
      messagesUnit: 'సందేశాలు',
      noTurnsTitle: 'ఈ సెషన్‌లో ఇంకా సంభాషణ లేదు',
      noTurnsSubtitle: 'తెలుగు, ఇంగ్లీష్ లేదా హిందీలో మాట్లాడటానికి Start నొక్కండి — లేదా కింద ప్రశ్న టైప్ చేయండి.',
      sttBadge: 'STT',
      ttsBadge: 'TTS',
      typedLabel: 'టైప్ చేసినది',
      inputPlaceholder: 'మీ వ్యవసాయ ప్రశ్నను ఇక్కడ టైప్ చేయండి...',
      sendAria: 'ప్రశ్న పంపండి',
      startAria: 'వాయిస్ రికార్డింగ్ ప్రారంభించండి',
      stopAria: 'రికార్డింగ్ ఆపి పంపండి',
      errEchoLock: 'సహాయకుడి వాయిస్ ప్లే అవుతున్నందున ఎకో రాకుండా మైక్ తాత్కాలికంగా ఆపబడింది.',
      errUnsupportedBrowser: 'ఈ బ్రౌజర్‌లో ఆడియో రికార్డింగ్ సపోర్ట్ లేదు. దయచేసి టెక్స్ట్ బాక్స్‌లో టైప్ చేయండి.',
      errMicDenied: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. మైక్ అనుమతి ఇవ్వండి లేదా టైప్ చేయండి.',
      errMicStart: 'మైక్రోఫోన్ ప్రారంభించడం సాధ్యం కాలేదు.',
      errRecordingShort: 'రికార్డింగ్ చాలా చిన్నదిగా ఉంది. దయచేసి స్పష్టంగా మాట్లాడి మళ్లీ ప్రయత్నించండి.',
      errNoSpeech: 'రికార్డింగ్ నుండి మాటలు స్పష్టంగా వినిపించలేదు. మళ్లీ మాట్లాడండి లేదా కింద టైప్ చేయండి.',
      errUnclearSpeech: 'మీ భాష లేదా ప్రశ్న స్పష్టంగా గుర్తించబడలేదు. దయచేసి తెలుగు, ఇంగ్లీష్ లేదా హిందీలో స్పష్టంగా మాట్లాడండి లేదా టైప్ చేయండి.',
      ttsWarningPrefix: 'వాయిస్ ఆడియో రూపొందించబడలేదు; టెక్స్ట్ సమాధానం చూపబడింది.',
      errSttFailed: 'వాయిస్ గుర్తింపు విఫలమైంది. మళ్లీ ప్రయత్నించండి లేదా టైప్ చేయండి.',
      errAskFailed: 'సహాయకుడి సమాధానం పొందడం విఫలమైంది.',
      continuousModeLabel: 'నిరంతర సంభాషణ',
      continuousModeOn: 'ఆన్',
      continuousModeOff: 'ఆఫ్',
      stopSpeakingBtn: 'మాట్లాడటం ఆపండి',
      pauseSpeakingBtn: 'ఆడియో విరామం',
      resumeSpeakingBtn: 'ఆడియో కొనసాగించండి',
      startAudioBtn: 'ఆడియో ప్రారంభించండి',
      autoplayBlockedHint: 'బ్రౌజర్ ఆటోమేటిక్ ఆడియోను ఆపింది. సమాధానం వినడానికి ఆడియో ప్రారంభించండి నొక్కండి.',
      stateSpeakingPaused: 'ఆడియో విరామంలో ఉంది',
    },
    cropDoctor: {
      title: 'క్రాప్ డాక్టర్ AI',
      subtitle: 'పంట ఫోటో అప్‌లోడ్ చేసి, కనిపించే లక్షణాలను పరిశీలించండి మరియు సురక్షిత IPM నివారణ సూచనలు పొందండి.',
      uploadCropImage: 'పంట ఫోటో అప్‌లోడ్ చేయండి',
      removeBtn: 'తొలగించండి',
      dragDropPrompt: 'పంట ఫోటోను ఇక్కడ డ్రాగ్ & డ్రాప్ చేయండి లేదా క్లిక్ చేయండి',
      formatLimit: 'JPG, PNG, WEBP (గరిష్టం 10 MB)',
      cameraBtn: 'కెమెరా',
      galleryBtn: 'గ్యాలరీ',
      replaceBtn: 'మార్చండి',
      previewPlaceholder: 'అప్‌లోడ్ చేసిన పంట ఫోటో ఇక్కడ కనిపిస్తుంది',
      cropNameLabel: 'పంట పేరు',
      cropNamePlaceholder: 'ఉదా., వరి, మిరప',
      locationLabel: 'లొకేషన్ (ఐచ్ఛికం)',
      locationPlaceholder: 'జిల్లా / రాష్ట్రం',
      growthStageLabel: 'పంట దశ (ఐచ్ఛికం)',
      growthStagePlaceholder: 'ఉదా., పిలక దశ, పూత దశ',
      notePlaceholder: 'అదనపు వివరాలు (ఉదా., 3 రోజుల క్రితం వర్షం తర్వాత ఆకులు పసుపు రంగులోకి మారాయి)...',
      inspectingPhoto: 'ఫోటో పరిశీలిస్తోంది...',
      analyzeCropBtn: 'పంటను విశ్లేషించండి',
      emptyAnalysisHint: 'కనిపించే లక్షణాలను పరిశీలించడానికి పగటి వెలుతురులో స్పష్టమైన ఫోటో అప్‌లోడ్ చేసి "పంటను విశ్లేషించండి" నొక్కండి.',
      visualInspectionFinding: 'ఫోటో పరిశీలన ఫలితం',
      photoUnclearBadge: 'ఫోటో స్పష్టంగా లేదు — మరో ఫోటో తీయండి',
      possibleIssueBadge: 'సాధ్యమైన సమస్య గుర్తించబడింది',
      cropCardLabel: 'పంట',
      observedSeverityLabel: 'తీవ్రత అంచనా',
      symptomsNoteLabel: 'కనిపించే లక్షణాలు & జాగ్రత్త గమనిక',
      conversationTitle: 'క్రాప్ డాక్టర్ సంభాషణ',
      savedToHistory: 'చరిత్రలో సేవ్ చేయబడింది',
      emptyConversationHint: 'మీ పంట విశ్లేషణ సారాంశం, వాయిస్ ప్లేబ్యాక్ మరియు తదుపరి ప్రశ్నోత్తరాలు ఇక్కడ కనిపిస్తాయి.',
      youLabel: 'మీరు',
      doctorAiLabel: 'GnaniCrop డాక్టర్ AI',
      followUpPlaceholder: 'ఈ పంట గురించి తదుపరి ప్రశ్న అడగండి...',
      followUpDisabledPlaceholder: 'తదుపరి ప్రశ్నలు అడగడానికి ముందుగా పంట ఫోటోను విశ్లేషించండి',
      verifiedSuggestionsTitle: 'ధృవీకరించబడిన సూచనలు (గరిష్టం 3)',
      ipmTag: 'IPM మొదటి ప్రాధాన్యత · లేబుల్ మార్గదర్శకం',
      verifiedEmptyHint: 'స్పష్టమైన ఫోటో విశ్లేషణ పూర్తయిన తర్వాతే ధృవీకరించబడిన జీవ నియంత్రణ మరియు నమోదిత సూచనలు కనిపిస్తాయి.',
      verifiedUnclearWarning: 'ఫోటో స్పష్టంగా లేనందున రసాయన లేదా ఇన్‌పుట్ సూచనలు నిలిపివేయబడ్డాయి. దయచేసి పగటి వెలుతురులో దగ్గరి ఫోటో అప్‌లోడ్ చేయండి లేదా స్థానిక KVK నిపుణులను సంప్రదించండి.',
      verifiedNoMatch: 'ఈ ప్రత్యేక లక్షణానికి ధృవీకరించబడిన కేటలాగ్ సరిపోలిక కనుగొనబడలేదు. కింది రసాయనేతర సంరక్షణ & నివారణ సూచనలను పాటించి స్థానిక వ్యవసాయ అధికారి / KVK ని సంప్రదించండి.',
      ipmBioBadge: 'IPM / బయో',
      activeLabel: 'యాక్టివ్ మూలకం',
      packLabel: 'ప్యాక్',
      priceLabel: 'ధర',
      checkDealerPrice: 'ధృవీకరించబడిన డీలర్ వద్ద నిర్ధారించండి',
      sourceBtn: 'మూలం',
      viewProductBtn: 'ఉత్పత్తి చూడండి',
      searchProductBtn: 'ఉత్పత్తిని శోధించండి',
      careTipsTitle: 'సంరక్షణ సూచనలు',
      preventionTipsTitle: 'నివారణ సూచనలు',
      errUnsupportedFormat: 'సపోర్ట్ లేని ఫార్మాట్. దయచేసి JPG, PNG లేదా WEBP ఫోటో అప్‌లోడ్ చేయండి.',
      errSizeLimit: 'ఫోటో పరిమాణం 10 MB మించిపోయింది. చిన్న ఫోటో ఎంచుకోండి.',
      errReadFail: 'ఎంచుకున్న ఫోటోను చదవడం విఫలమైంది.',
      errUploadFirst: 'దయచేసి ముందుగా పంట లేదా ఆకు ఫోటో అప్‌లోడ్ చేయండి.',
      errAnalyzeFail: 'పంట ఫోటోను విశ్లేషించడం సాధ్యం కాలేదు.',
      errFollowUpFail: 'తదుపరి ప్రశ్న పంపడం విఫలమైంది.',
      errTimeout: 'విశ్లేషణకు ఎక్కువ సమయం పట్టింది. దయచేసి మీ ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.',
      errInvalidResponse: 'సర్వర్ నుండి అసంపూర్తి విశ్లేషణ అందింది. దయచేసి మళ్లీ ప్రయత్నించండి.',
      retryAnalyzeBtn: 'మళ్లీ విశ్లేషించండి',
      analyzingConversationHint: 'తెలుగులో పంట ఫోటో లక్షణాలను పరిశీలిస్తోంది...',
      analyzingSubHint: 'ఫోటో విశ్లేషణ, సంరక్షణ సూచనలు మరియు వాయిస్ ఆడియో రూపొందించబడుతోంది.',
    },
    profile: {
      title: 'నా ప్రొఫైల్',
      subtitle: 'వ్యక్తిగతీకరించిన వ్యవసాయ సలహాలు, హెచ్చరికలు మరియు పథకాల సమాచారం కోసం మీ వివరాలను నవీకరించండి.',
      personalDetails: 'వ్యక్తిగత వివరాలు',
      fullNameLabel: 'పూర్తి పేరు',
      fullNamePlaceholder: 'మీ పూర్తి పేరు నమోదు చేయండి',
      mobileNumberLabel: 'మొబైల్ నంబర్',
      digitsSuffix: 'అంకెలు',
      mobilePlaceholder: '10-అంకెల భారత మొబైల్ నంబర్ (లేదా +91...)',
      mobileHelp: 'సెట్ చేయబడినప్పుడు SMS OTP ధృవీకరణ మరియు పంట హెచ్చరికల కోసం ఉపయోగించబడుతుంది.',
      emailLabel: 'ఇమెయిల్',
      optionalLabel: '(ఐచ్ఛికం)',
      validEmail: 'సరైన ఇమెయిల్',
      invalidFormat: 'తప్పు ఫార్మాట్',
      emailPlaceholder: 'farmer@example.com',
      verifyMobileTitle: 'మొబైల్ నంబర్ ధృవీకరణ',
      verifyEmailTitle: 'ఇమెయిల్ ధృవీకరణ',
      verifiedBadge: 'ధృవీకరించబడింది',
      unverifiedBadge: 'ధృవీకరించబడలేదు',
      serviceNotConfigured: 'ధృవీకరణ సేవ సెట్ చేయబడలేదు',
      smsOtpNotice: 'నిజమైన SMS OTP కోసం సర్వర్‌లో Twilio Verify వివరాలు అవసరం. నకిలీ OTP లు ఎప్పుడూ చూపబడవు.',
      emailOtpNotice: 'నిజమైన ఇమెయిల్ OTP కోసం సర్వర్‌లో Resend API కాన్ఫిగరేషన్ అవసరం.',
      sendOtpUnavailable: 'OTP పంపండి (అందుబాటులో లేదు)',
      verifyEmailUnavailable: 'ఇమెయిల్ ధృవీకరించండి (అందుబాటులో లేదు)',
      readyToVerifyPrefix: 'ధృవీకరించడానికి సిద్ధంగా ఉంది +91',
      enterMobileFirst: 'ముందుగా సరైన 10-అంకెల నంబర్ నమోదు చేయండి',
      enterEmailFirst: 'సరైన ఐచ్ఛిక ఇమెయిల్ నమోదు చేయండి',
      sendingBtn: 'పంపుతోంది...',
      resendInPrefix: 'మళ్లీ పంపడానికి',
      resendOtpBtn: 'OTP మళ్లీ పంపండి',
      sendOtpBtn: 'OTP పంపండి',
      sendEmailOtpBtn: 'ఇమెయిల్ OTP పంపండి',
      verifyingBtn: 'ధృవీకరిస్తోంది...',
      verifyConfirmBtn: 'ధృవీకరించి నిర్ధారించండి',
      safeTitle: 'మీ సమాచారం పూర్తిగా సురక్షితం',
      safeSubtitle: 'మీ వ్యవసాయ సలహాలు, వాతావరణ హెచ్చరికలు మరియు పథకాల సమాచారం అందించడానికి మాత్రమే ఉపయోగించబడుతుంది.',
      cancelBtn: 'రద్దు చేయండి',
      saveChangesBtn: 'మార్పులను సేవ్ చేయండి',
      errNameRequired: 'పూర్తి పేరు తప్పనిసరి.',
      errMobileInvalid: 'దయచేసి సరైన 10-అంకెల భారత మొబైల్ నంబర్ నమోదు చేయండి.',
      errEmailInvalid: 'దయచేసి సరైన ఇమెయిల్ చిరునామా నమోదు చేయండి.',
      errSaveFail: 'ప్రొఫైల్ సేవ్ చేయడం విఫలమైంది.',
      savedSuccess: 'ప్రొఫైల్ వివరాలు విజయవంతంగా సేవ్ చేయబడ్డాయి.',
      errOtpDigits: 'మొత్తం 6 OTP అంకెలను నమోదు చేయండి.',
      errOtpVerifyFail: 'ధృవీకరణ విఫలమైంది.',
    },
    history: {
      bannerTitlePrefix: 'మీ సంభాషణ',
      bannerTitleHighlight: 'చరిత్ర',
      bannerSubtitle: 'మీ గత వాయిస్ అసిస్టెంట్ మరియు క్రాప్ డాక్టర్ AI సంభాషణలను చూడండి, కొనసాగించండి లేదా నిర్వహించండి.',
      voiceTabLabel: 'వాయిస్ అసిస్టెంట్ చరిత్ర',
      cropTabLabel: 'క్రాప్ డాక్టర్ చరిత్ర',
      searchPlaceholder: 'మీ చరిత్రలో వెతకండి...',
      allTime: 'అన్ని కాలాలు',
      today: 'ఈరోజు',
      last7d: 'గత 7 రోజులు',
      last30d: 'గత 30 రోజులు',
      voiceListTitle: 'వాయిస్ అసిస్టెంట్ సంభాషణలు',
      noVoiceMatch: 'మీ ఫిల్టర్‌కు సరిపోయే వాయిస్ చరిత్ర లేదు.',
      voiceSelectPrompt: 'పూర్తి STT ట్రాన్స్‌క్రిప్ట్ మరియు TTS వాయిస్ వినడానికి ఒక సంభాషణను ఎంచుకోండి.',
      languageLabel: 'భాష',
      cropListTitle: 'క్రాప్ డాక్టర్ విశ్లేషణలు',
      noCropMatch: 'మీ ఫిల్టర్‌కు సరిపోయే క్రాప్ డాక్టర్ చరిత్ర లేదు.',
      cropSelectPrompt: 'సేవ్ చేసిన ఫోటో, సంరక్షణ సూచనలు మరియు చాట్ చూడటానికి ఒక నివేదికను ఎంచుకోండి.',
      careTipsTitle: 'సంరక్షణ సూచనలు',
      preventionTipsTitle: 'నివారణ సూచనలు',
      verifiedProductsTitle: 'సూచించిన ధృవీకరించబడిన ఉత్పత్తులు',
      sourceBtn: 'మూలం',
      viewProductBtn: 'ఉత్పత్తి చూడండి',
      searchProductBtn: 'ఉత్పత్తిని శోధించండి',
      youLabel: 'మీరు',
      doctorAiLabel: 'GnaniCrop డాక్టర్ AI',
      continueBtn: 'సంభాషణ కొనసాగించండి',
      deleteBtn: 'తొలగించండి',
      deleteModalTitle: 'చరిత్ర రికార్డును తొలగించాలా?',
      deleteConfirmPrefix: 'మీరు ఖచ్చితంగా ఈ రికార్డును శాశ్వతంగా తొలగించాలనుకుంటున్నారా:',
      deletingBtn: 'తొలగిస్తోంది...',
      farmLabel: 'పొలం',
      downloadPdfBtn: 'టెక్స్ట్ డౌన్‌లోడ్ (PDF)',
      downloadZipBtn: 'పూర్తి సంభాషణ డౌన్‌లోడ్',
      downloadAllBtn: 'మొత్తం చరిత్ర డౌన్‌లోడ్',
      downloadingLabel: 'డౌన్‌లోడ్ సిద్ధమవుతోంది...',
      downloadSuccess: 'డౌన్‌లోడ్ పూర్తయింది.',
      downloadError: 'డౌన్‌లోడ్ చేయడం విఫలమైంది.',
      noHistoryToExport: 'డౌన్‌లోడ్ చేయడానికి చరిత్ర రికార్డులు ఇంకా లేవు.',
    },
    settings: {
      pageTitle: 'సెట్టింగ్‌లు (Settings)',
      pageSubtitle: 'మీ ప్రాధాన్యతల ప్రకారం అప్లికేషన్‌ను అనుకూలీకరించుకోండి',
      bannerTitle: 'అప్లికేషన్ సెట్టింగ్‌లు',
      bannerSubtitle: 'భాష, వాయిస్, నోటిఫికేషన్లు, థీమ్ మరియు గోప్యతా ప్రాధాన్యతలను నిర్వహించండి.',
      languageTitle: 'భాష (Language)',
      languageDesc: 'అప్లికేషన్ మరియు సహాయకుడు ఉపయోగించే భాషను ఎంచుకోండి',
      voiceTitle: 'వాయిస్ సెట్టింగ్‌లు (Voice Settings)',
      voiceDesc: 'AI వాయిస్ సహాయకుని కోసం వాయిస్, వేగం మరియు శైలిని ఎంచుకోండి',
      voiceModelLabel: 'వాయిస్ రకం',
      voiceSpeedLabel: 'వాయిస్ వేగం',
      voiceStyleLabel: 'వాయిస్ శైలి',
      voiceStyleNormal: 'సాధారణ',
      voiceStyleClear: 'స్పష్టంగా',
      voiceStyleConcise: 'సంక్షిప్తంగా',
      voiceSupportNoteConfigured: 'తెలుగు, ఇంగ్లీష్ మరియు హిందీ కోసం Gnani Timbre TTS సర్వర్‌లో కనెక్ట్ చేయబడింది.',
      voiceSupportNoteFallback: 'సర్వర్‌లో Gnani Timbre TTS కీ సెట్ చేయబడలేదు; అందుబాటులో ఉన్న బ్రౌజర్/Gemini వాయిస్ ఫాల్‌బ్యాక్ ఉపయోగించబడుతుంది.',
      notificationsTitle: 'నోటిఫికేషన్లు (Notifications)',
      notificationsDesc: 'మీకు అవసరమైన అలర్ట్‌లను ఎంచుకోండి',
      notifReminders: 'పంట పనుల రిమైండర్లు',
      notifWeather: 'వాతావరణ హెచ్చరికలు',
      notifSchemes: 'ప్రభుత్వ పథకాల నోటిఫికేషన్లు',
      notifCropAdvice: 'పంట సంరక్షణ సూచనలు',
      themeTitle: 'థీమ్ (Theme)',
      themeDesc: 'లైట్, డార్క్ లేదా సిస్టమ్ రూపాన్ని మార్చండి',
      themeLight: 'లైట్ (Light)',
      themeDark: 'డార్క్ (Dark)',
      themeSystem: 'సిస్టమ్ (System)',
      appPrefsTitle: 'అప్లికేషన్ ప్రాధాన్యతలు',
      appPrefsDesc: 'మీ వ్యవసాయ అవసరాలకు అనుగుణంగా సెట్టింగ్‌లు',
      unitsLabel: 'కొలత విధానం (Units)',
      acres: 'ఎకరాలు (Acres)',
      hectares: 'హెక్టార్లు (Hectares)',
      defaultLocationLabel: 'డిఫాల్ట్ లొకేషన్',
      seasonLabel: 'పంట సీజన్',
      reminderTimeLabel: 'రిమైండర్ సమయం',
      privacyTitle: 'గోప్యత & డేటా (Privacy & Data)',
      privacyDesc: 'మీ ఖాతాలో నిల్వ చేసిన డేటాను చూడండి లేదా తొలగించండి',
      privacyExplain:
        'మీ వినియోగదారు పేరు, ఎన్క్రిప్టెడ్ పాస్‌వర్డ్, ప్రొఫైల్, పొలం వివరాలు, రిమైండర్లు, వాయిస్ సంభాషణలు మరియు క్రాప్ డాక్టర్ ఫోటోలు మీ ఖాతా కోసం మాత్రమే సురక్షితంగా నిల్వ చేయబడతాయి.',
      downloadData: 'నా డేటాను డౌన్‌లోడ్ చేయండి (JSON)',
      deleteData: 'నా చరిత్ర & పొలం డేటాను తొలగించండి',
      deleteConfirmTitle: 'చరిత్ర మరియు పొలం డేటాను తొలగించాలా?',
      deleteConfirmBody:
        'ఇది మీ వాయిస్ అసిస్టెంట్ సంభాషణలు, క్రాప్ డాక్టర్ నివేదికలు, రిమైండర్లు మరియు పొలం వివరాలను శాశ్వతంగా తొలగిస్తుంది.',
      helpTitle: 'సహాయం & మద్దతు (Help & Support)',
      helpDesc: 'సాధారణ ప్రశ్నలు, వినియోగదారు మార్గదర్శి మరియు వ్యవసాయ సహాయం',
      faqHeading: 'తరచుగా అడిగే ప్రశ్నలు (FAQ)',
      faqs: [
        {
          q: 'తెలుగు, హిందీ లేదా ఇంగ్లీష్‌లో ప్రశ్నలు ఎలా అడగాలి?',
          a: 'వాయిస్ అసిస్టెంట్ పేజీని తెరిచి, మీ భాషను ఎంచుకుని మైక్రోఫోన్ బటన్ నొక్కండి లేదా టైప్ చేయండి.',
        },
        {
          q: 'క్రాప్ డాక్టర్ కొన్నిసార్లు మరొక ఫోటో ఎందుకు అడుగుతుంది?',
          a: 'మసకగా లేదా చీకటిగా ఉన్న ఫోటోలను ఖచ్చితంగా పరిశీలించలేము. పగటి వెలుతురులో ఆకు లేదా కాండం దగ్గరగా స్పష్టంగా ఫోటో తీయండి.',
        },
        {
          q: 'మందుల మోతాదు (Dosage) స్వయంచాలకంగా చూపించబడుతుందా?',
          a: 'కాదు. రైతు భద్రత కోసం GnaniKisan AI మందుల మోతాదును ఊహించదు. ఎల్లప్పుడూ అధికారిక లేబుల్ చదవండి మరియు స్థానిక KVK లేదా వ్యవసాయ అధికారిని సంప్రదించండి.',
        },
      ],
      guideHeading: 'వినియోగదారు మార్గదర్శి',
      guideSteps: [
        '1. డ్యాష్‌బోర్డ్‌లోని "My Farm Details"లో మీ పొలం విస్తీర్ణం, పంటలు, నేల మరియు నీటిపారుదల వివరాలను సేవ్ చేయండి.',
        '2. మీ భాషలో పంటలు, వాతావరణం మరియు పథకాల సమాచారం కోసం వాయిస్ అసిస్టెంట్ ఉపయోగించండి.',
        '3. పంట సమస్యల కోసం క్రాప్ డాక్టర్ AI లో స్పష్టమైన ఫోటో అప్‌లోడ్ చేయండి.',
      ],
      supportContactNote:
        'క్షేత్రస్థాయి నిర్ధారణ కోసం మీ సమీప కృషి విజ్ఞాన కేంద్రం (KVK) లేదా మండల వ్యవసాయ అధికారిని సంప్రదించండి.',
      aboutTitle: 'GnaniKisan AI గురించి',
      aboutVersion: 'వెర్షన్ 1.0.0',
      aboutDesc:
        'GnaniKisan AI అనేది భారతీయ రైతుల కోసం రూపొందించిన AI ఆధారిత వ్యవసాయ సహాయకుడు. ఇది వాతావరణం, పంట సంరక్షణ, మార్కెట్ ధరలు, ప్రభుత్వ పథకాలు మరియు వ్యవసాయ సలహాలను మీ భాషలో అందిస్తుంది.',
      integrationsHeading: 'సేవల కనెక్షన్ స్థితి',
      resetDefaults: 'డిఫాల్ట్ సెట్టింగ్‌లకు రీసెట్ చేయండి',
      saveChanges: 'మార్పులను సేవ్ చేయండి',
      savedToast: 'సెట్టింగ్‌లు విజయవంతంగా సేవ్ చేయబడ్డాయి.',
      resetToast: 'సెట్టింగ్‌లు డిఫాల్ట్‌లకు రీసెట్ చేయబడ్డాయి.',
      deletedToast: 'మీ సంభాషణ చరిత్ర, రిమైండర్లు మరియు పొలం వివరాలు తొలగించబడ్డాయి.',
      errorToast: 'సెట్టింగ్‌లను సేవ్ చేయడం విఫలమైంది.',
    },
  },
  hi: {
    nav: {
      dashboard: 'डैशबोर्ड',
      voice: 'वॉइस असिस्टेंट',
      cropDoctor: 'क्रॉप डॉक्टर AI',
      profile: 'प्रोफ़ाइल',
      history: 'इतिहास (History)',
      settings: 'सेटिंग्स',
      logout: 'लॉग आउट',
      tagline: 'AI आधारित कृषि सहायक',
    },
    logoutModal: {
      title: 'GnaniKisan AI से लॉग आउट करें?',
      description: 'आपके खेत का विवरण, प्रोफ़ाइल और बातचीत का इतिहास आपके खाते में सुरक्षित रहेगा।',
      cancel: 'रद्द करें',
      confirm: 'हाँ, लॉग आउट करें',
    },
    common: {
      save: 'सहेजें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      close: 'बंद करें',
      loading: 'लोड हो रहा है...',
      retry: 'पुनः प्रयास करें',
      continueConv: 'बातचीत जारी रखें',
      connected: 'कनेक्टेड',
      notConfigured: 'कॉन्फ़िगर नहीं है',
      error: 'त्रुटि',
      locationNotSet: 'स्थान सेट नहीं है',
      updateLocation: 'स्थान बदलें',
    },
    auth: {
      loadingApp: 'GnaniKisan AI लोड हो रहा है...',
      tagline: 'AI आधारित कृषि सहायक',
      heroTitle: 'तेलुगु, अंग्रेज़ी और हिंदी में आपका विश्वसनीय कृषि साथी।',
      heroDesc: 'लाइव मौसम पूर्वानुमान, फसलों की मंडी कीमतें, क्रॉप डॉक्टर पत्ती जांच और आपके खेत के अनुसार सरकारी योजनाओं की जानकारी।',
      prototypeTitle: 'लोकल प्रोटोटाइप प्रमाणीकरण',
      prototypeDesc: 'पासवर्ड सर्वर पर scrypt के साथ सुरक्षित रूप से हैश किए जाते हैं और HttpOnly कुकीज़ में सहेजे जाते हैं।',
      farmerLogin: 'किसान लॉगिन',
      createAccountTitle: 'खाता बनाएं',
      loginSubtitle: 'अपने खेत का डैशबोर्ड और सहेजा गया इतिहास देखने के लिए साइन इन करें।',
      registerSubtitle: 'कुछ सेकंड में अपना GnaniKisan AI खाता बनाएं।',
      username: 'उपयोगकर्ता नाम',
      usernamePlaceholder: 'अपना उपयोगकर्ता नाम दर्ज करें',
      password: 'पासवर्ड',
      passwordLoginPlaceholder: 'पासवर्ड दर्ज करें',
      passwordRegisterPlaceholder: 'कम से कम 6 अक्षर',
      confirmPassword: 'पासवर्ड की पुष्टि करें',
      confirmPasswordPlaceholder: 'पासवर्ड दोबारा दर्ज करें',
      showPassword: 'पासवर्ड दिखाएं',
      hidePassword: 'पासवर्ड छुपाएं',
      loginBtn: 'लॉगिन',
      createAccountBtn: 'खाता बनाएं',
      newToApp: 'GnaniKisan AI पर नए हैं?',
      alreadyAccount: 'पहले से खाता है?',
      backToLogin: 'लॉगिन पर वापस जाएं',
      welcomeTitle: 'GnaniKisan AI में स्वागत है, {username}',
      farmLocationSetTo: 'खेत का स्थान सेट किया गया:',
      yourFarm: 'आपका खेत',
      openDashboard: 'डैशबोर्ड खोलें',
      errUsernameMin: 'उपयोगकर्ता नाम कम से कम 3 अक्षरों का होना चाहिए।',
      errPasswordMin: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
      errPasswordMismatch: 'पासवर्ड मेल नहीं खाते।',
      errAuthFailed: 'प्रमाणीकरण विफल रहा।',
      errSessionExpired: 'आपका लॉगिन सत्र समाप्त हो गया है। स्थान सहेजने के लिए कृपया दोबारा साइन इन करें।',
      featWeather: 'लाइव मौसम',
      featCropDoctor: 'क्रॉप डॉक्टर',
      featMarketPrices: 'मंडी भाव',
      featGovtSchemes: 'सरकारी योजनाएं',
      orDivider: 'या',
    },
    locationModal: {
      title: 'अपने खेत का स्थान सेट करें',
      subtitlePrefix: 'नमस्ते',
      subtitleSuffix: 'लाइव मौसम, मंडी कीमतों और राज्य योजनाओं के लिए स्थान का उपयोग किया जाता है।',
      closeAria: 'स्थान विंडो बंद करें',
      privacyNote: 'आपके निर्देशांक केवल आपकी अनुमति से लिए जाते हैं। यदि GPS या खोज उपलब्ध न हो, तो नीचे अपना गाँव, जिला और राज्य मैन्युअल रूप से दर्ज करें।',
      detecting: 'स्थान खोजा जा रहा है...',
      allowGps: 'स्थान की अनुमति दें (GPS)',
      enterManuallyBtn: 'स्थान मैन्युअल रूप से दर्ज करें',
      signInAgain: 'दोबारा साइन इन करें',
      searchLabel: 'गाँव / शहर / जिला खोजें (वैकल्पिक)',
      searchPlaceholder: 'जैसे, राजमुंदरी, गुंटूर, वारंगल...',
      searchBtn: 'खोजें',
      manualEntryTitle: 'मैन्युअल स्थान दर्ज करें',
      villagePlaceholder: 'गाँव / शहर *',
      districtPlaceholder: 'जिला',
      statePlaceholder: 'राज्य (जैसे, आंध्र प्रदेश)',
      saving: 'सहेजा जा रहा है...',
      saveLocation: 'स्थान सहेजें',
      errSessionExpired: 'आपका लॉगिन सत्र समाप्त हो गया है या सत्यापित नहीं हो सका। कृपया दोबारा साइन इन करें।',
      errGeoUnsupported: 'इस ब्राउज़र में स्थान सेवा उपलब्ध नहीं है। कृपया नीचे अपना गाँव, जिला और राज्य दर्ज करें।',
      errReverseFallback: 'स्वचालित पता खोज अभी उपलब्ध नहीं है। आपके GPS निर्देशांक मिल गए हैं—सहेजने के लिए गाँव, जिला और राज्य दर्ज करें।',
      errPermissionDenied: 'स्थान की अनुमति अस्वीकार कर दी गई। नीचे अपना गाँव, जिला और राज्य मैन्युअल रूप से दर्ज करें।',
      errDetectFailed: 'अभी GPS निर्देशांक नहीं मिल सके। कृपया नीचे अपना गाँव, जिला और राज्य मैन्युअल रूप से दर्ज करें।',
      errSearchEmpty: 'कोई मिलता-जुलता भारतीय स्थान नहीं मिला। नीचे मैन्युअल रूप से दर्ज करें।',
      errSearchUnavailable: 'स्थान खोज अभी उपलब्ध नहीं है। नीचे मैन्युअल रूप से दर्ज करें।',
      errSelectSave: 'चयनित स्थान सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।',
      errVillageRequired: 'कृपया अपने गाँव या शहर का नाम दर्ज करें।',
      errManualSave: 'मैन्युअल स्थान सहेजने में विफल। कृपया पुनः प्रयास करें।',
    },
    audioPlayer: {
      playAria: 'आवाज़ चलाएं',
      pauseAria: 'आवाज़ रोकें',
      speechBadge: 'आवाज़',
      gnaniTimbre: 'Gnani Timbre',
      geminiTts: 'Gemini TTS',
      deviceSpeech: 'डिवाइस आवाज़',
      downloadAudio: 'ऑडियो डाउनलोड',
      downloadAudioUnavailable: 'इस उत्तर के लिए ऑडियो फ़ाइल उपलब्ध नहीं है',
      downloadAudioSuccess: 'ऑडियो डाउनलोड हो गया',
      retryAudio: 'ऑडियो पुनः प्रयास करें',
      retryingAudio: 'ऑडियो बन रहा है...',
      audioUnavailable: 'ऑडियो अभी उपलब्ध नहीं है — आप ऊपर उत्तर पढ़ सकते हैं या ऑडियो पुनः प्रयास करें दबा सकते हैं।',
      audioLoadError: 'ऑडियो चलाने में त्रुटि हुई। पुनः प्रयास करें पर क्लिक करें।',
      loadingDuration: 'लोड हो रहा है...',
      stopAria: 'बोलना बंद करें',
      stopSpeaking: 'रोकें',
      resumeAria: 'फिर से चलाएं',
      startAudioBtn: 'ऑडियो शुरू करें',
      autoplayBlockedHint: 'ब्राउज़र ने ऑटो-प्ले रोक दिया है — सुनने के लिए ऑडियो शुरू करें दबाएं।',
    },
    dashboard: {
      loadingDashboard: 'आपका कृषि डैशबोर्ड लोड हो रहा है...',
      unableToLoad: 'डैशबोर्ड लोड नहीं हो सका।',
      welcomePrefix: 'स्वागत है,',
      companionLine: 'GnaniKisan AI — आपका AI कृषि साथी',
      yourFarmLocation: 'आपके खेत का स्थान',
      manualNoGps: 'मैन्युअल स्थान (GPS निर्देशांक नहीं)',
      mapView: 'मानचित्र देखें',
      setGps: 'GPS सेट करें',
      weatherToday: 'आज का मौसम',
      openMeteoLive: 'Open-Meteo लाइव',
      unavailable: 'उपलब्ध नहीं',
      humidity: 'नमी',
      wind: 'हवा',
      rainChance: 'बारिश की संभावना',
      next3Days: 'अगले 3 दिन',
      rainLabel: 'बारिश',
      liveWeatherUnavailable: 'लाइव मौसम उपलब्ध नहीं है',
      setGeocodedLocation: 'स्थान निर्देशांक सेट करें',
      updatedLabel: 'अपडेटेड',
      marketPriceToday: 'आज का मंडी भाव',
      liveAgmarknet: 'लाइव AGMARKNET',
      cachedAgmarknet: 'कैश्ड AGMARKNET',
      notConfiguredBadge: 'सेट नहीं है',
      unavailableBadge: 'उपलब्ध नहीं',
      emptyBadge: 'कोई आवक नहीं',
      refreshBtn: 'रीफ़्रेश करें',
      showingRatesFor: 'चयनित फसलें · स्रोत:',
      minMaxLabel: 'न्यूनतम–अधिकतम',
      minPriceLabel: 'न्यूनतम',
      maxPriceLabel: 'अधिकतम',
      modalPriceLabel: 'मॉडल',
      dataDateLabel: 'डेटा दिनांक',
      lastUpdatedLabel: 'अंतिम अपडेट',
      arrivalLabel: 'डेटा दिनांक',
      noMandiMatch: 'नवीनतम AGMARKNET फ़ीड में आपकी चयनित फसलों के लिए कोई मंडी भाव नहीं मिला।',
      mandiUnavailableTitle: 'लाइव मंडी भाव अभी उपलब्ध नहीं हैं',
      mandiCachedNotice: 'लाइव AGMARKNET अभी उपलब्ध नहीं है। {date} के अंतिम सत्यापित भाव दिखाए जा रहे हैं।',
      mandiNotConfiguredDesc: 'सर्वर पर DATA_GOV_API_KEY कॉन्फ़िगर नहीं है। लाइव मंडी भाव के लिए API कुंजी जोड़ें।',
      mandiUnavailableDesc: 'अभी data.gov.in से लाइव AGMARKNET भाव प्राप्त नहीं हो सके। कोई काल्पनिक भाव नहीं दिखाया जा रहा है।',
      mandiRefusedDesc: 'आधिकारिक AGMARKNET सर्वर (api.data.gov.in) ने इस होस्टिंग नेटवर्क से कनेक्शन अस्वीकार कर दिया। कोई काल्पनिक भाव नहीं दिखाया गया है।',
      mandiTimeoutDesc: 'data.gov.in AGMARKNET API का समय समाप्त हो गया। कृपया पुनः प्रयास करें।',
      mandiInvalidKeyDesc: 'data.gov.in द्वारा DATA_GOV_API_KEY अस्वीकार कर दी गई। अपनी API कुंजी जांचें।',
      mandiRateLimitedDesc: 'data.gov.in API सीमा पूरी हो गई है। कुछ देर बाद पुनः प्रयास करें।',
      myFarmDetails: 'मेरे खेत का विवरण',
      totalArea: 'कुल क्षेत्रफल',
      notSet: 'सेट नहीं है',
      cropsLabel: 'फसलें',
      noneSelected: 'कोई चयनित नहीं',
      soilLabel: 'मिट्टी',
      irrigationLabel: 'सिंचाई',
      stageLabel: 'अवस्था',
      sownLabel: 'बुवाई',
      govtSchemesTitle: 'आपके लिए सरकारी योजनाएं',
      prevScheme: 'पिछली योजना',
      nextScheme: 'अगली योजना',
      officialPortal: 'आधिकारिक पोर्टल',
      verifiedLabel: 'सत्यापित',
      workReminders: 'खेती कार्य रिमाइंडर',
      addReminder: 'रिमाइंडर जोड़ें',
      noReminders: 'अभी कोई रिमाइंडर नहीं है। सिंचाई, खाद या खेत निरीक्षण के रिमाइंडर जोड़ें।',
      markComplete: 'पूर्ण चिह्नित करें',
      markIncomplete: 'अपूर्ण चिह्नित करें',
      snoozeTip: '1 दिन के लिए टालें',
      editTip: 'रिमाइंडर संपादित करें',
      deleteTip: 'रिमाइंडर हटाएं',
      recentConversations: 'हाल की बातचीत',
      viewHistory: 'इतिहास देखें →',
      noConversations: 'अभी कोई बातचीत नहीं है। वॉइस असिस्टेंट से बात करें या क्रॉप डॉक्टर AI में पत्ती की फ़ोटो अपलोड करें।',
      voiceAssistantLabel: 'वॉइस असिस्टेंट',
      cropDoctorLabel: 'क्रॉप डॉक्टर AI',
      continueBtn: 'जारी रखें',
      farmLocationQuickActions: 'खेत स्थान और त्वरित कार्य',
      changeBtn: 'बदलें',
      districtLabel: 'जिला',
      stateLabel: 'राज्य',
      updateFarmDetails: 'खेत विवरण अपडेट करें',
      openCropDoctor: 'क्रॉप डॉक्टर खोलें',
      voiceAssistantAction: 'वॉइस असिस्टेंट',
      setWorkReminder: 'कार्य रिमाइंडर सेट करें',
      editFarmTitle: 'मेरे खेत का विवरण संपादित करें',
      totalLandArea: 'कुल भूमि क्षेत्रफल',
      unitLabel: 'इकाई',
      acres: 'एकड़',
      hectares: 'हेक्टेयर',
      cropsGrownMultiple: 'उगाई जाने वाली फसलें (एक से अधिक चुनें)',
      addAnotherCropPlaceholder: 'अन्य फसल जोड़ें...',
      addBtn: 'जोड़ें',
      soilTypeLabel: 'मिट्टी का प्रकार',
      irrigationSourceLabel: 'सिंचाई का स्रोत',
      sowingDateOpt: 'बुवाई की तारीख (वैकल्पिक)',
      growthStageOpt: 'फसल अवस्था (वैकल्पिक)',
      growthStagePlaceholder: 'जैसे, वानस्पतिक / फूल अवस्था',
      savingBtn: 'सहेजा जा रहा है...',
      saveFarmBtn: 'खेत विवरण सहेजें',
      editReminderTitle: 'रिमाइंडर संपादित करें',
      addReminderTitle: 'कार्य रिमाइंडर जोड़ें',
      taskTitleLabel: 'कार्य का शीर्षक *',
      taskTitlePlaceholder: 'जैसे, धान की मेड़ में पानी का स्तर जांचें',
      dateLabel: 'दिनांक *',
      timeLabel: 'समय *',
      cropOptionalLabel: 'फसल (वैकल्पिक)',
      generalAllCrops: 'सामान्य / सभी फसलें',
      saveReminderBtn: 'रिमाइंडर सहेजें',
      saveFarmError: 'खेत विवरण सहेजने में विफल।',
      soilTypes: {
        Black: 'काली मिट्टी',
        Red: 'लाल मिट्टी',
        Alluvial: 'जलोढ़ मिट्टी',
        Sandy: 'बलुई मिट्टी',
        Clay: 'चिकनी मिट्टी',
        Other: 'अन्य',
      },
      irrigationTypes: {
        Borewell: 'बोरवेल',
        Canal: 'नहर',
        Drip: 'ड्रिप (टपक सिंचाई)',
        Sprinkler: 'स्प्रिंकलर',
        'Rain-fed': 'वर्षा आधारित',
        Other: 'अन्य',
      },
      weatherCodes: {
        0: 'साफ़ आसमान',
        1: 'मुख्यतः साफ़',
        2: 'आंशिक बादल',
        3: 'घने बादल',
        45: 'कोहरा',
        48: 'पाला/कोहरा',
        51: 'हल्की फुहार',
        53: 'मध्यम फुहार',
        55: 'तेज़ फुहार',
        61: 'हल्की बारिश',
        63: 'मध्यम बारिश',
        65: 'भारी बारिश',
        71: 'हल्की बर्फबारी',
        80: 'हल्की बौछारें',
        81: 'मध्यम बौछारें',
        82: 'तेज़ बौछारें',
        95: 'गरज-चमक के साथ बारिश',
        96: 'ओलावृष्टि और तूफ़ान',
      },
      weatherVariable: 'परिवर्तनशील बादल',
      schemeStatusMatched: 'पात्रता मानदंड मेल खाते हैं (पोर्टल पर जांचें)',
      schemeStatusRelevant: 'संभावित रूप से उपयुक्त',
    },
    voice: {
      poweredByGnani: 'Gnani AI द्वारा संचालित',
      gnaniNotConfiguredFallback: 'Gnani स्पीच कॉन्फ़िगर नहीं है — फ़ॉलबैक का उपयोग हो रहा है',
      prismaSttLabel: 'Prisma STT',
      timbreTtsLabel: 'Timbre TTS',
      echoProtectionNote: 'आवाज़ चलने के दौरान इको सुरक्षा सक्रिय है',
      talkToPrefix: 'बात करें:',
      subtitle: 'अपने खेत के बारे में कुछ भी पूछें — फसलें, मौसम, मंडी भाव, मिट्टी, सिंचाई या सरकारी योजनाएं',
      stateReady: 'तैयार — तेलुगु, अंग्रेज़ी या हिंदी में बोलने के लिए माइक्रोफ़ोन दबाएं',
      stateAutoListening: 'आपकी भाषा स्वतः पहचानी जा रही है...',
      stateListening: 'सुन रहा है...',
      statePaused: 'रुका हुआ',
      stateUnderstanding: 'आपका प्रश्न समझा जा रहा है...',
      statePreparing: 'आपका उत्तर तैयार किया जा रहा है...',
      stateProcessing: 'आपकी आवाज़ समझी जा रही है और उत्तर तैयार हो रहा है...',
      stateSpeaking: 'उत्तर सुनाया जा रहा है (इको रोकने के लिए माइक लॉक है)...',
      stateSpeakingLang: '{lang} में बोल रहा है',
      stateError: 'माइक्रोफ़ोन जांचें या नीचे टाइप करें',
      autoDetectBtn: 'स्वतः पहचान (Auto-Detect)',
      autoDetectActiveBadge: 'स्वतः पहचान सक्रिय',
      manualOverrideBadge: 'मैन्युअल भाषा लॉक',
      detectedLabel: 'पहचानी गई भाषा',
      langNameTe: 'तेलुगु',
      langNameEn: 'अंग्रेज़ी',
      langNameHi: 'हिंदी',
      startBtn: 'शुरू करें',
      pauseBtn: 'रोकें',
      resumeBtn: 'जारी रखें',
      stopSendBtn: 'रोकें और भेजें',
      resetBtn: 'रीसेट',
      tryAsking: 'यह पूछकर देखें:',
      voiceConversation: 'वॉइस बातचीत',
      messagesUnit: 'संदेश',
      noTurnsTitle: 'इस सत्र में अभी कोई बातचीत नहीं है',
      noTurnsSubtitle: 'तेलुगु, अंग्रेज़ी या हिंदी में बोलने के लिए शुरू करें दबाएं — या नीचे प्रश्न टाइप करें।',
      sttBadge: 'STT',
      ttsBadge: 'TTS',
      typedLabel: 'टाइप किया गया',
      inputPlaceholder: 'अपना कृषि प्रश्न यहां टाइप करें...',
      sendAria: 'प्रश्न भेजें',
      startAria: 'वॉइस रिकॉर्डिंग शुरू करें',
      stopAria: 'रिकॉर्डिंग रोकें और भेजें',
      errEchoLock: 'इको रोकने के लिए जब सहायक बोल रहा हो तब माइक बंद रहता है।',
      errUnsupportedBrowser: 'इस ब्राउज़र में ऑडियो रिकॉर्डिंग समर्थित नहीं है। कृपया नीचे टेक्स्ट बॉक्स का उपयोग करें।',
      errMicDenied: 'माइक्रोफ़ोन की अनुमति अस्वीकार कर दी गई। माइक अनुमति दें या अपना प्रश्न टाइप करें।',
      errMicStart: 'माइक्रोफ़ोन शुरू नहीं हो सका।',
      errRecordingShort: 'रिकॉर्डिंग बहुत छोटी थी। कृपया स्पष्ट बोलकर दोबारा प्रयास करें।',
      errNoSpeech: 'रिकॉर्डिंग में स्पष्ट आवाज़ नहीं मिली। कृपया फिर से बोलें या नीचे टाइप करें।',
      errUnclearSpeech: 'आपकी भाषा या प्रश्न स्पष्ट रूप से समझ नहीं आया। कृपया तेलुगु, अंग्रेज़ी या हिंदी में स्पष्ट बोलें या टाइप करें।',
      ttsWarningPrefix: 'आवाज़ ऑडियो तैयार नहीं हो सका; लिखित उत्तर दिखाया जा रहा है।',
      errSttFailed: 'आवाज़ पहचान विफल रही। कृपया पुनः प्रयास करें या टाइप करें।',
      errAskFailed: 'सहायक से उत्तर प्राप्त नहीं हो सका।',
      continuousModeLabel: 'निरंतर बातचीत',
      continuousModeOn: 'चालू',
      continuousModeOff: 'बंद',
      stopSpeakingBtn: 'बोलना बंद करें',
      pauseSpeakingBtn: 'ऑडियो रोकें',
      resumeSpeakingBtn: 'ऑडियो जारी रखें',
      startAudioBtn: 'ऑडियो शुरू करें',
      autoplayBlockedHint: 'ब्राउज़र ने स्वचालित ऑडियो रोक दिया है। उत्तर सुनने के लिए ऑडियो शुरू करें दबाएं।',
      stateSpeakingPaused: 'ऑडियो रुका हुआ है',
    },
    cropDoctor: {
      title: 'क्रॉप डॉक्टर AI',
      subtitle: 'फसल की फ़ोटो अपलोड करें, दिखने वाले लक्षणों की जांच करें और सुरक्षित देखभाल व IPM सुझाव पाएं।',
      uploadCropImage: 'फसल की फ़ोटो अपलोड करें',
      removeBtn: 'हटाएं',
      dragDropPrompt: 'फ़ोटो खींचकर छोड़ें या अपलोड करने के लिए क्लिक करें',
      formatLimit: 'JPG, PNG, WEBP (अधिकतम 10 MB)',
      cameraBtn: 'कैमरा',
      galleryBtn: 'गैलरी',
      replaceBtn: 'बदलें',
      previewPlaceholder: 'अपलोड की गई फसल की फ़ोटो यहां दिखेगी',
      cropNameLabel: 'फसल का नाम',
      cropNamePlaceholder: 'जैसे, धान, मिर्च',
      locationLabel: 'स्थान (वैकल्पिक)',
      locationPlaceholder: 'जिला / राज्य',
      growthStageLabel: 'फसल अवस्था (वैकल्पिक)',
      growthStagePlaceholder: 'जैसे, कल्ले निकलना, फूल आना',
      notePlaceholder: 'वैकल्पिक नोट (जैसे, 3 दिन पहले बारिश के बाद पीलापन दिखा)...',
      inspectingPhoto: 'फ़ोटो की जांच हो रही है...',
      analyzeCropBtn: 'फसल की जांच करें',
      emptyAnalysisHint: 'दिन की रोशनी में साफ़ फ़ोटो अपलोड करें और लक्षणों की जांच के लिए "फसल की जांच करें" पर क्लिक करें।',
      visualInspectionFinding: 'फ़ोटो निरीक्षण परिणाम',
      photoUnclearBadge: 'फ़ोटो अस्पष्ट — साफ़ फ़ोटो लें',
      possibleIssueBadge: 'संभावित समस्या चिह्नित',
      cropCardLabel: 'फसल',
      observedSeverityLabel: 'देखी गई गंभीरता',
      symptomsNoteLabel: 'दिखने वाले लक्षण और सावधानी नोट',
      conversationTitle: 'क्रॉप डॉक्टर बातचीत',
      savedToHistory: 'इतिहास में सहेजा गया',
      emptyConversationHint: 'आपका विश्लेषण सारांश, वॉइस प्लेबैक और आगे के प्रश्नोत्तर यहां दिखेंगे।',
      youLabel: 'आप',
      doctorAiLabel: 'GnaniCrop डॉक्टर AI',
      followUpPlaceholder: 'इस फसल के बारे में आगे का प्रश्न पूछें...',
      followUpDisabledPlaceholder: 'आगे के प्रश्न पूछने के लिए पहले फसल की फ़ोटो जांचें',
      verifiedSuggestionsTitle: 'सत्यापित संदर्भ सुझाव (अधिकतम 3)',
      ipmTag: 'IPM प्राथमिकता · लेबल निर्देशित',
      verifiedEmptyHint: 'सत्यापित जैव-नियंत्रण और पंजीकृत संदर्भ विकल्प स्पष्ट निरीक्षण के बाद ही दिखेंगे।',
      verifiedUnclearWarning: 'फ़ोटो अस्पष्ट होने के कारण रासायनिक या इनपुट सुझाव रोके गए हैं। कृपया दिन की रोशनी में साफ़ नज़दीकी फ़ोटो अपलोड करें या स्थानीय KVK विशेषज्ञ से सलाह लें।',
      verifiedNoMatch: 'इस निष्कर्ष के लिए कोई सत्यापित कैटलॉग मिलान नहीं मिला। नीचे दिए गए गैर-रासायनिक देखभाल और रोकथाम सुझाव अपनाएं और कृषि अधिकारी / KVK से संपर्क करें।',
      ipmBioBadge: 'IPM / जैविक',
      activeLabel: 'सक्रिय तत्व',
      packLabel: 'पैक',
      priceLabel: 'कीमत',
      checkDealerPrice: 'सत्यापित विक्रेता से जांचें',
      sourceBtn: 'स्रोत',
      viewProductBtn: 'उत्पाद देखें',
      searchProductBtn: 'उत्पाद खोजें',
      careTipsTitle: 'देखभाल के उपाय',
      preventionTipsTitle: 'रोकथाम के उपाय',
      errUnsupportedFormat: 'असमर्थित फ़ॉर्मैट। कृपया JPG, PNG या WEBP फ़ोटो अपलोड करें।',
      errSizeLimit: 'फ़ोटो 10 MB सीमा से अधिक है। कृपया छोटी फ़ोटो चुनें।',
      errReadFail: 'चयनित फ़ोटो पढ़ने में विफल।',
      errUploadFirst: 'कृपया पहले फसल या पत्ती की फ़ोटो अपलोड करें।',
      errAnalyzeFail: 'फसल की फ़ोटो का विश्लेषण नहीं हो सका।',
      errFollowUpFail: 'अगला प्रश्न भेजने में विफल।',
      errTimeout: 'विश्लेषण में अधिक समय लगा और अनुरोध समाप्त हो गया। कृपया पुनः प्रयास करें।',
      errInvalidResponse: 'सर्वर से अधूरा विश्लेषण प्राप्त हुआ। कृपया पुनः प्रयास करें।',
      retryAnalyzeBtn: 'पुनः जांच करें',
      analyzingConversationHint: 'हिन्दी में फसल के लक्षणों की जांच हो रही है...',
      analyzingSubHint: 'फ़ोटो का विश्लेषण, देखभाल के उपाय और वॉइस ऑडियो तैयार किया जा रहा है।',
    },
    profile: {
      title: 'मेरी प्रोफ़ाइल',
      subtitle: 'व्यक्तिगत कृषि सलाह, अलर्ट और योजनाओं की जानकारी पाने के लिए अपना विवरण अपडेट रखें।',
      personalDetails: 'व्यक्तिगत विवरण',
      fullNameLabel: 'पूरा नाम',
      fullNamePlaceholder: 'अपना पूरा नाम दर्ज करें',
      mobileNumberLabel: 'मोबाइल नंबर',
      digitsSuffix: 'अंक',
      mobilePlaceholder: '10-अंकों का भारतीय मोबाइल नंबर (या +91...)',
      mobileHelp: 'कॉन्फ़िगर होने पर SMS OTP सत्यापन और फसल अलर्ट के लिए उपयोग किया जाता है।',
      emailLabel: 'ईमेल',
      optionalLabel: '(वैकल्पिक)',
      validEmail: 'मान्य ईमेल',
      invalidFormat: 'गलत फ़ॉर्मैट',
      emailPlaceholder: 'farmer@example.com',
      verifyMobileTitle: 'मोबाइल नंबर सत्यापित करें',
      verifyEmailTitle: 'ईमेल सत्यापित करें',
      verifiedBadge: 'सत्यापित',
      unverifiedBadge: 'असत्यापित',
      serviceNotConfigured: 'सत्यापन सेवा कॉन्फ़िगर नहीं है',
      smsOtpNotice: 'वास्तविक SMS OTP के लिए सर्वर पर Twilio Verify क्रेडेंशियल आवश्यक हैं। नकली OTP कभी नहीं दिखाए जाते।',
      emailOtpNotice: 'वास्तविक ईमेल OTP के लिए सर्वर पर Resend API कॉन्फ़िगरेशन आवश्यक है।',
      sendOtpUnavailable: 'OTP भेजें (उपलब्ध नहीं)',
      verifyEmailUnavailable: 'ईमेल सत्यापित करें (उपलब्ध नहीं)',
      readyToVerifyPrefix: 'सत्यापन के लिए तैयार +91',
      enterMobileFirst: 'पहले मान्य 10-अंकों का नंबर दर्ज करें',
      enterEmailFirst: 'मान्य वैकल्पिक ईमेल दर्ज करें',
      sendingBtn: 'भेजा जा रहा है...',
      resendInPrefix: 'दोबारा भेजें',
      resendOtpBtn: 'OTP दोबारा भेजें',
      sendOtpBtn: 'OTP भेजें',
      sendEmailOtpBtn: 'ईमेल OTP भेजें',
      verifyingBtn: 'सत्यापित हो रहा है...',
      verifyConfirmBtn: 'सत्यापित करें और पुष्टि करें',
      safeTitle: 'आपकी जानकारी पूरी तरह सुरक्षित है',
      safeSubtitle: 'इसका उपयोग केवल आपकी कृषि सलाह, मौसम चेतावनी और योजनाओं की जानकारी देने के लिए किया जाता है।',
      cancelBtn: 'रद्द करें',
      saveChangesBtn: 'परिवर्तन सहेजें',
      errNameRequired: 'पूरा नाम आवश्यक है।',
      errMobileInvalid: 'कृपया मान्य 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें।',
      errEmailInvalid: 'कृपया मान्य ईमेल पता दर्ज करें।',
      errSaveFail: 'प्रोफ़ाइल सहेजने में विफल।',
      savedSuccess: 'प्रोफ़ाइल विवरण सफलतापूर्वक सहेजे गए।',
      errOtpDigits: 'सभी 6 OTP अंक दर्ज करें।',
      errOtpVerifyFail: 'सत्यापन विफल रहा।',
    },
    history: {
      bannerTitlePrefix: 'आपकी बातचीत का',
      bannerTitleHighlight: 'इतिहास',
      bannerSubtitle: 'अपनी पिछली वॉइस असिस्टेंट और क्रॉप डॉक्टर AI बातचीत को देखें, जारी रखें या प्रबंधित करें।',
      voiceTabLabel: 'वॉइस असिस्टेंट इतिहास',
      cropTabLabel: 'क्रॉप डॉक्टर इतिहास',
      searchPlaceholder: 'अपना इतिहास खोजें...',
      allTime: 'सभी समय',
      today: 'आज',
      last7d: 'पिछले 7 दिन',
      last30d: 'पिछले 30 दिन',
      voiceListTitle: 'वॉइस असिस्टेंट बातचीत',
      noVoiceMatch: 'आपके फ़िल्टर से कोई वॉइस इतिहास नहीं मिला।',
      voiceSelectPrompt: 'पूरा STT ट्रांसक्रिप्ट और TTS ऑडियो प्लेबैक देखने के लिए कोई बातचीत चुनें।',
      languageLabel: 'भाषा',
      cropListTitle: 'क्रॉप डॉक्टर विश्लेषण',
      noCropMatch: 'आपके फ़िल्टर से कोई क्रॉप डॉक्टर इतिहास नहीं मिला।',
      cropSelectPrompt: 'सहेजी गई फ़ोटो, देखभाल के उपाय और चैट देखने के लिए कोई रिपोर्ट चुनें।',
      careTipsTitle: 'देखभाल के उपाय',
      preventionTipsTitle: 'रोकथाम के उपाय',
      verifiedProductsTitle: 'संदर्भित सत्यापित उत्पाद',
      sourceBtn: 'स्रोत',
      viewProductBtn: 'उत्पाद देखें',
      searchProductBtn: 'उत्पाद खोजें',
      youLabel: 'आप',
      doctorAiLabel: 'GnaniCrop डॉक्टर AI',
      continueBtn: 'बातचीत जारी रखें',
      deleteBtn: 'हटाएं',
      deleteModalTitle: 'इतिहास रिकॉर्ड हटाएं?',
      deleteConfirmPrefix: 'क्या आप वाकई इसे स्थायी रूप से हटाना चाहते हैं:',
      deletingBtn: 'हटाया जा रहा है...',
      farmLabel: 'खेत',
      downloadPdfBtn: 'टेक्स्ट डाउनलोड (PDF)',
      downloadZipBtn: 'पूरी बातचीत डाउनलोड',
      downloadAllBtn: 'संपूर्ण इतिहास डाउनलोड',
      downloadingLabel: 'डाउनलोड तैयार हो रहा है...',
      downloadSuccess: 'डाउनलोड तैयार है।',
      downloadError: 'डाउनलोड तैयार करने में त्रुटि हुई।',
      noHistoryToExport: 'डाउनलोड करने के लिए अभी कोई इतिहास रिकॉर्ड नहीं है।',
    },
    settings: {
      pageTitle: 'सेटिंग्स (Settings)',
      pageSubtitle: 'अपनी प्राथमिकताओं के अनुसार ऐप को कस्टमाइज़ करें',
      bannerTitle: 'एप्लिकेशन सेटिंग्स',
      bannerSubtitle: 'भाषा, वॉइस प्लेबैक, अलर्ट, थीम और गोपनीयता सेटिंग्स प्रबंधित करें।',
      languageTitle: 'भाषा (Language)',
      languageDesc: 'ऐप और सहायक की भाषा चुनें',
      voiceTitle: 'वॉइस सेटिंग्स (Voice Settings)',
      voiceDesc: 'AI वॉइस सहायक के लिए आवाज़, गति और शैली चुनें',
      voiceModelLabel: 'वॉइस प्रोफ़ाइल',
      voiceSpeedLabel: 'बोलने की गति',
      voiceStyleLabel: 'उत्तर शैली',
      voiceStyleNormal: 'सामान्य',
      voiceStyleClear: 'स्पष्ट व विस्तृत',
      voiceStyleConcise: 'संक्षिप्त',
      voiceSupportNoteConfigured: 'तेलुगु, अंग्रेज़ी और हिंदी के लिए सर्वर पर Gnani Timbre TTS कनेक्टेड है।',
      voiceSupportNoteFallback: 'सर्वर पर Gnani Timbre TTS कुंजी कॉन्फ़िगर नहीं है; उपलब्ध ब्राउज़र/Gemini वॉइस फ़ॉलबैक का उपयोग किया जा रहा है।',
      notificationsTitle: 'सूचनाएं (Notifications)',
      notificationsDesc: 'चुनें कि आप कौन से अलर्ट प्राप्त करना चाहते हैं',
      notifReminders: 'खेती कार्य रिमाइंडर',
      notifWeather: 'मौसम चेतावनी',
      notifSchemes: 'सरकारी योजना अपडेट',
      notifCropAdvice: 'फसल देखभाल सलाह',
      themeTitle: 'थीम (Theme)',
      themeDesc: 'लाइट, डार्क या सिस्टम मोड चुनें',
      themeLight: 'लाइट (Light)',
      themeDark: 'डार्क (Dark)',
      themeSystem: 'सिस्टम (System)',
      appPrefsTitle: 'ऐप प्राथमिकताएं',
      appPrefsDesc: 'इकाइयाँ, स्थान, मौसम और रिमाइंडर समय सेट करें',
      unitsLabel: 'माप की इकाई (Units)',
      acres: 'एकड़ (Acres)',
      hectares: 'हेक्टेयर (Hectares)',
      defaultLocationLabel: 'डिफ़ॉल्ट स्थान',
      seasonLabel: 'फसल सीज़न',
      reminderTimeLabel: 'डिफ़ॉल्ट रिमाइंडर समय',
      privacyTitle: 'गोपनीयता और डेटा (Privacy & Data)',
      privacyDesc: 'आपके खाते में सहेजे गए डेटा की समीक्षा करें या हटाएं',
      privacyExplain:
        'आपका उपयोगकर्ता नाम, सुरक्षित पासवर्ड हैश, प्रोफ़ाइल, खेत विवरण, रिमाइंडर, वॉइस ट्रांसक्रिप्ट और क्रॉप डॉक्टर फ़ोटो केवल आपके खाते के लिए सर्वर पर सुरक्षित रूप से सहेजे जाते हैं।',
      downloadData: 'मेरा डेटा डाउनलोड करें (JSON)',
      deleteData: 'मेरा इतिहास और खेत डेटा हटाएं',
      deleteConfirmTitle: 'इतिहास और खेत डेटा हटाएं?',
      deleteConfirmBody:
        'इससे आपकी सभी वॉइस बातचीत, क्रॉप डॉक्टर विश्लेषण, रिमाइंडर और खेत विवरण स्थायी रूप से हट जाएंगे।',
      helpTitle: 'सहायता और समर्थन (Help & Support)',
      helpDesc: 'अक्सर पूछे जाने वाले प्रश्न, उपयोगकर्ता गाइड और कृषि मार्गदर्शन',
      faqHeading: 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
      faqs: [
        {
          q: 'तेलुगु, हिंदी या अंग्रेज़ी में प्रश्न कैसे पूछें?',
          a: 'वॉइस असिस्टेंट खोलें, अपनी भाषा चुनें और बीच के माइक्रोफ़ोन बटन को दबाएं या नीचे टाइप करें।',
        },
        {
          q: 'क्रॉप डॉक्टर कभी-कभी दूसरी फ़ोटो क्यों मांगता है?',
          a: 'धुंधली या कम रोशनी वाली फ़ोटो से सही पहचान संभव नहीं होती। दिन की रोशनी में प्रभावित पत्ती या तने की साफ़ फ़ोटो लें।',
        },
        {
          q: 'क्या रासायनिक दवा की मात्रा (Dosage) अपने आप बताई जाती है?',
          a: 'नहीं। सुरक्षा के लिए GnaniKisan AI कभी भी रासायनिक दवा की मात्रा अनुमान से नहीं बताता। हमेशा पंजीकृत लेबल पढ़ें और स्थानीय KVK / कृषि अधिकारी से सलाह लें।',
        },
      ],
      guideHeading: 'त्वरित उपयोग गाइड',
      guideSteps: [
        '1. डैशबोर्ड में "My Farm Details" में अपना क्षेत्रफल, फसलें, मिट्टी और सिंचाई सहेजें।',
        '2. अपनी भाषा में मौसम, फसल और सरकारी योजनाओं के लिए वॉइस असिस्टेंट का उपयोग करें।',
        '3. फसल की समस्या की सावधानीपूर्वक जांच के लिए क्रॉप डॉक्टर AI में साफ़ फ़ोटो अपलोड करें।',
      ],
      supportContactNote:
        'खेत पर सटीक जांच के लिए अपने नजदीकी कृषि विज्ञान केंद्र (KVK) या कृषि अधिकारी से संपर्क करें।',
      aboutTitle: 'GnaniKisan AI के बारे में',
      aboutVersion: 'संस्करण 1.0.0',
      aboutDesc:
        'GnaniKisan AI भारतीय किसानों के लिए बनाया गया एक AI कृषि सहायक है। यह आपकी भाषा में मौसम, फसल देखभाल, मंडी संदर्भ, सरकारी योजनाएं और खेती की सलाह प्रदान करता है।',
      integrationsHeading: 'सेवा कनेक्शन स्थिति',
      resetDefaults: 'डिफ़ॉल्ट पर रीसेट करें',
      saveChanges: 'परिवर्तन सहेजें',
      savedToast: 'सेटिंग्स सफलतापूर्वक सहेजी गईं।',
      resetToast: 'सेटिंग्स डिफ़ॉल्ट पर रीसेट कर दी गईं।',
      deletedToast: 'आपका बातचीत इतिहास, रिमाइंडर और खेत विवरण हटा दिए गए हैं।',
      errorToast: 'सेटिंग्स सहेजने में त्रुटि हुई।',
    },
  },
};
