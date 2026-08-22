import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validerEpost, validerKortnavn } from '../../src/lib/invitasjoner.js';

describe('validerEpost', () => {
  test('godtar en gyldig e-post og normaliserer til lowercase/trimmet', () => {
    assert.equal(validerEpost('  Sopp.Sanker@Eksempel.NO  '), 'sopp.sanker@eksempel.no');
  });

  test('kaster på tom/manglende e-post', () => {
    assert.throws(() => validerEpost(''));
    assert.throws(() => validerEpost(undefined));
    assert.throws(() => validerEpost('   '));
  });

  test('kaster på e-post uten @ eller domene', () => {
    assert.throws(() => validerEpost('ikke-en-epost'));
    assert.throws(() => validerEpost('mangler@domene'));
    assert.throws(() => validerEpost('@mangler-lokaldel.no'));
  });
});

describe('validerKortnavn', () => {
  test('godtar et gyldig, trimmet kortnavn', () => {
    assert.equal(validerKortnavn('  Ola  '), 'Ola');
  });

  test('kaster på tomt kortnavn', () => {
    assert.throws(() => validerKortnavn(''));
    assert.throws(() => validerKortnavn('   '));
  });

  test('kaster på for langt kortnavn (> 100 tegn)', () => {
    assert.throws(() => validerKortnavn('a'.repeat(101)));
  });

  test('godtar akkurat 100 tegn', () => {
    const navn = 'a'.repeat(100);
    assert.equal(validerKortnavn(navn), navn);
  });
});
