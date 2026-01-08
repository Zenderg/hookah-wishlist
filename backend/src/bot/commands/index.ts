import { startCommand } from './start';
import { helpCommand } from './help';
import { searchCommand } from './search';
import { wishlistCommand } from './wishlist';
import { addCommand } from './add';
import { removeCommand } from './remove';

export function registerCommands() {
  startCommand();
  helpCommand();
  searchCommand();
  wishlistCommand();
  addCommand();
  removeCommand();
}
