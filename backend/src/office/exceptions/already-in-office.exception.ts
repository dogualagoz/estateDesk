import { ConflictException } from '@nestjs/common';

/**
 * Kullanıcı zaten bir ofise dahilken başka (veya aynı) bir ofisin davetini
 * kabul etmeye çalıştığında fırlatılır. Frontend `code` alanına göre
 * "aynı ofis" / "farklı ofis, ayrılabilir" / "farklı ofis, kurucu" ayrımını
 * yapıp uygun ekranı gösterir (bkz. InviteAcceptView.vue).
 */
export class AlreadyInOfficeException extends ConflictException {
  constructor(currentOfficeName: string, isOwner: boolean, sameOffice: boolean) {
    super({
      code: 'ALREADY_IN_OFFICE',
      message: 'Zaten bir ofistesiniz',
      currentOfficeName,
      isOwner,
      sameOffice,
    });
  }
}
