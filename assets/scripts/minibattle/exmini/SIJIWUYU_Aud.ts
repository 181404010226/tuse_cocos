import { _decorator, AudioClip, AudioSource, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SIJIWUYU_Aud')
export class SIJIWUYU_Aud extends Component {

    static instance: SIJIWUYU_Aud = null;

    @property({ displayName: "bgm", type: AudioSource })
    bgm: AudioSource = null;
    @property({ displayName: "Aud", type: AudioSource })
    aud: AudioSource = null;

    @property(AudioClip)
    mainAud: AudioClip = null;
    @property(AudioClip)
    gameAud: AudioClip = null;
    @property(AudioClip)
    clickAud: AudioClip = null;
    @property(AudioClip)
    winAud: AudioClip = null;
    @property(AudioClip)
    failAud: AudioClip = null;
    @property(AudioClip)
    rightAud: AudioClip = null;

    onLoad() {
        SIJIWUYU_Aud.instance = this;

        this.onPlayBgm(this.mainAud);
    }
    //播放bgm
    onPlayBgm(clip: AudioClip) {
        if (this.bgm != null) {
            this.bgm.stop();
            this.bgm.clip = clip;
            this.bgm.play();
            this.bgm.loop = true;
        }
    }
    //播放Aud
    onPlayAud(clip: AudioClip) {
        if (this.aud != null) {
            this.aud.playOneShot(clip, 1);
        }
    }
}

