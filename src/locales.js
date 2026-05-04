export default {
  de: {
    collapseTextOverlayOptions: 'OCR-Optionen einklappen',
    disableTextOverlay: 'OCR deaktivieren',
    enableTextOverlay: 'OCR aktivieren',
    expandTextOverlayOptions: 'OCR-Optionen ausklappen',
    overlayOpacity: 'Transparenz',
    overlayVisible: 'OCR Anzeigen/Verbergen',
    overlayTextSelectable: 'Textauswahl aktivieren',
    colorPicker: 'Farbauswahl',
    color: 'Farbe',
    resetColor: 'Farbe zurücksetzen',
    ocrCorrectionTooltip: 'Fehler melden',
    ocrCorrectionSubject: 'Verbesserung OCR-Text',
    ocrCorrectionBody: `
Mein Korrekturvorschlag: 

"{{text}}"

-----

Betroffene Seite:
{{url}}

{{metadata}}
Signatur: {{signature}}
Seite: {{page}}
Zeile:

"{{text}}"

-----

`,
  },
  fr: {
    collapseTextOverlayOptions: 'Replier les options OCR',
    disableTextOverlay: 'Désactiver l’OCR',
    enableTextOverlay: 'Activer l’OCR',
    expandTextOverlayOptions: 'Déplier les options OCR',
    overlayOpacity: 'Opacité',
    overlayVisible: 'Afficher/masquer l’OCR',
    overlayTextSelectable: 'Activer la sélection de texte',
    colorPicker: 'Choisir une couleur',
    color: 'Couleur',
    resetColor: 'Réinitialiser la couleur',
    // Keys provided by mirador-textoverlay; we mirror them here so the French
    // translation wins when the two plugins are loaded together.
    textSelect: 'Sélection du texte',
    textVisible: 'Texte visible',
    textOpacity: 'Opacité du texte',
    opacityCurrentValue: 'Opacité actuelle du texte : {{value}} pour cent',
    ocrCorrectionTooltip: 'Signaler une erreur',
    ocrCorrectionSubject: 'Amélioration texte OCR',
    ocrCorrectionBody: `
Ma proposition de correction : 

"{{text}}"

-----

Page concernée :
{{url}}

{{metadata}}
Cote : {{signature}}
Page : {{page}}
Ligne :

"{{text}}"

-----

`,
  },
  it: {
    collapseTextOverlayOptions: 'Comprimi opzioni OCR',
    disableTextOverlay: 'Disattiva OCR',
    enableTextOverlay: 'Attiva OCR',
    expandTextOverlayOptions: 'Espandi opzioni OCR',
    overlayOpacity: 'Opacità',
    overlayVisible: 'Visualizza/Nascondi OCR',
    overlayTextSelectable: 'Abilita selezione testo',
    colorPicker: 'Selettore colore',
    color: 'Colore',
    resetColor: 'Ripristina colore',
    ocrCorrectionTooltip: 'Segnala errore',
    ocrCorrectionSubject: 'Correzione del testo OCR',
    ocrCorrectionBody: `
La mia correzione proposta:

"{{text}}"

-----

Pagina:
{{url}}

{{metadata}}
Segnatura: {{signature}}
Pagina: {{page}}
Riga:

"{{text}}"

-----

`,
  },
  en: {
    collapseTextOverlayOptions: 'Collapse OCR options',
    disableTextOverlay: 'Disable OCR',
    enableTextOverlay: 'Enable OCR',
    expandTextOverlayOptions: 'Expand OCR options',
    overlayOpacity: 'Opacity',
    overlayVisible: 'Show/Hide OCR',
    overlayTextSelectable: 'Allow text selection',
    colorPicker: 'Color picker',
    color: 'Color',
    resetColor: 'Reset color',
    ocrCorrectionTooltip: 'Report error',
    ocrCorrectionSubject: 'Improvement to OCR text',
    ocrCorrectionBody: `
My suggested correction: 

"{{text}}"

-----

Page:
{{url}}

{{metadata}}
Reference code: {{signature}}
Page: {{page}}
Line:

"{{text}}"

-----


`,
  },
};
