# Sound Lab 音標練習室

英語 44 個音素的 IPA 練習網頁。單一 HTML 檔、沒有相依套件、不需要後端，開著就能用。

**線上版**：啟用 GitHub Pages 後是 `https://<你的帳號>.github.io/ipa-sound-lab/`

![mode: chart / dictation / lookup](https://img.shields.io/badge/modes-5-0b6e6a) ![no build step](https://img.shields.io/badge/build-none-8f5f13)

## 功能

| 模式 | 做什麼 |
| --- | --- |
| **音標表** | 依 BBC／Sounds Right 的排法：單母音 4×3（舌位由高到低、由前到後）、雙母音、子音三列並標示清濁。點任一格聽例字。 |
| **聽寫拼音** | 聽一個單字，用下方的音標鍵盤把每個音拼出來。可提示下一個音、可顯示拼法、檢查時會標出拼錯的音素。 |
| **查單字音標** | 輸入單字或一整句，逐字列出音標；字典收錄的標「字典」，未收錄的用拼字規則推測並標「推測」。每個音素可單獨點來聽例字。 |
| **聽音選音標** | 聽單字，從四個只差一個音素的選項中挑出正確的一串。 |
| **最小對立對** | ship／sheep、thin／sin 這類只差一個音的配對聽辨。 |

全站可切換 **英式 RP** 與 **美式 GA**：音標表的音素、字典的標音、題目的答案都會跟著換，語音也會改用對應口音的語音合成。

## 44 個音素

- **12 個單母音**：iː ɪ ʊ uː e ə ɜː ɔː æ ʌ ɑː ɒ
- **8 個雙母音**：ɪə eɪ ʊə ɔɪ əʊ eə aɪ aʊ
- **24 個子音**：p b t d tʃ dʒ k ɡ ／ f v θ ð s z ʃ ʒ ／ m n ŋ h l r w j

子音前八組左清右濁（/p b/、/t d/、/tʃ dʒ/、/k ɡ/、/f v/、/θ ð/、/s z/、/ʃ ʒ/）：口型一樣，差別只在聲帶振不振動。美式 GA 把 /ɒ/ 併入 /ɑː/、沒有 /ɪə eə ʊə/，並多出 /ɚ ɝː/。

## 本機執行

不需要編譯，直接打開 `index.html` 就好。想用本機伺服器：

```bash
python -m http.server 8000
```

## 發佈到 GitHub Pages

Settings → Pages → Source 選 **Deploy from a branch**，分支選 `main`、資料夾選 `/ (root)`，存檔後約一分鐘就會有網址。

## 已知限制

- 發音用瀏覽器內建的 `speechSynthesis`，有沒有英式／美式語音看作業系統。Windows 可在「設定 → 時間與語言 → 語音」加裝 English (United Kingdom) 或 (United States) 語音。
- 語音合成唸不出孤立的音素，所以點音標格聽到的是**例字**，不是單一音。
- 字典目前約 300 個常用字；沒收錄的字用拼字規則推測，英文例外很多，推測結果僅供參考。歡迎直接在 `index.html` 的 `RAW` 陣列裡補字，格式是 `單字|英式音標|美式音標`（兩者相同時省略第三欄）。

## 參考

- [British Council — Sounds Right 發音表](https://www.britishcouncil.org.tw/teach/courses-resources/sounds-right)
- [SIL IPA Help](https://software.sil.org/zh-TW/ipahelp2-1/)
- [IPA chart 介紹](https://prepedu.com/zh-hant/blog/ipa-chart)

## 授權

MIT，見 [LICENSE](LICENSE)。
