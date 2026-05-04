export default {
  de: {
    collapseTextOverlayOptions: 'OCR-Optionen einklappen',
    disableTextOverlay: 'OCR deaktivieren',
    enableTextOverlay: 'OCR aktivieren',
    expandTextOverlayOptions: 'OCR-Optionen ausklappen',
    overlayOpacity: 'Transparenz',
    overlayVisible: 'OCR Anzeigen/Verbergen',
    overlayTextSelectable: 'Textauswahl aktivieren',
    textSelect: 'Textauswahl',
    textVisible: 'Text sichtbar',
    textOpacity: 'Textdeckkraft',
    opacityCurrentValue: 'Aktuelle Textdeckkraft: {{value}} Prozent',
    colorPicker: 'Farbauswahl',
    textColor: 'Textfarbe',
    backgroundColor: 'Hintergrundfarbe',
    resetTextColors: 'Textfarben zurücksetzen',
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
    textColor: 'Couleur du texte',
    backgroundColor: 'Couleur de fond',
    resetTextColors: 'Réinitialiser les couleurs',
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
    textSelect: 'Selezione del testo',
    textVisible: 'Testo visibile',
    textOpacity: 'Opacità del testo',
    opacityCurrentValue: 'Opacità attuale del testo: {{value}} per cento',
    colorPicker: 'Selettore colore',
    textColor: 'Colore del testo',
    backgroundColor: 'Colore di sfondo',
    resetTextColors: 'Ripristina i colori',
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
    textSelect: 'Text selection',
    textVisible: 'Text visible',
    textOpacity: 'Text opacity',
    opacityCurrentValue: 'Current text opacity: {{value}} percent',
    colorPicker: 'Color picker',
    textColor: 'Text color',
    backgroundColor: 'Background color',
    resetTextColors: 'Reset text colors',
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
