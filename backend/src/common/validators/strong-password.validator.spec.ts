import { validate } from 'class-validator';
import { IsStrongPassword } from './strong-password.validator';

class Dummy {
  @IsStrongPassword()
  password!: string;
}

async function errorsFor(password: string) {
  const d = new Dummy();
  d.password = password;
  return validate(d);
}

describe('IsStrongPassword', () => {
  it('7 karakterli şifreyi reddeder (min 8 kuralı)', async () => {
    const errors = await errorsFor('Abcd123');
    expect(errors).toHaveLength(1);
  });

  it('büyük harfsiz şifreyi reddeder', async () => {
    const errors = await errorsFor('abcdefg1');
    expect(errors).toHaveLength(1);
  });

  it('rakamsız şifreyi reddeder', async () => {
    const errors = await errorsFor('Abcdefgh');
    expect(errors).toHaveLength(1);
  });

  it('kuralları sağlayan şifreyi kabul eder', async () => {
    const errors = await errorsFor('Abcdef12');
    expect(errors).toHaveLength(0);
  });
});
